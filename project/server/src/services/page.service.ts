import { Page, IPageDocument } from '../models/Page';
import { Workspace } from '../models/Workspace';
import { AuditLog } from '../models/AuditLog';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { CreatePageInput, UpdatePageInput, MovePageInput } from '../validators/page.validator';

class PageService {
  async createPage(data: CreatePageInput, userId: string): Promise<IPageDocument> {
    const workspace = await Workspace.findById(data.workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot create pages');
    }

    // If parent is specified, verify it exists
    if (data.parentId) {
      const parent = await Page.findById(data.parentId);
      if (!parent || parent.workspace.toString() !== data.workspaceId) {
        throw ApiError.notFound('Parent page not found');
      }
    }

    // Get max position for siblings
    const lastPage = await Page.findOne({
      workspace: data.workspaceId,
      parent: data.parentId || null,
    })
      .sort({ position: -1 })
      .select('position');

    const page = await Page.create({
      title: data.title || 'Untitled',
      content: data.content || '{}',
      workspace: data.workspaceId,
      parent: data.parentId,
      icon: data.icon,
      cover: data.cover,
      position: (lastPage?.position ?? -1) + 1,
      createdBy: userId,
      lastEditedBy: userId,
    });

    await this.logAudit(userId, 'page.create', page._id.toString(), data.workspaceId, {
      title: page.title,
    });

    return page;
  }

  async getPage(pageId: string, userId: string): Promise<IPageDocument> {
    const page = await Page.findById(pageId)
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate({
        path: 'children',
        match: { isArchived: false },
        options: { sort: { position: 1 } },
      });

    if (!page) {
      throw ApiError.notFound('Page not found');
    }

    // Published pages are public
    if (!page.isPublished) {
      const workspace = await Workspace.findById(page.workspace);
      if (!workspace || !workspace.isMember(userId)) {
        throw ApiError.forbidden('Access denied');
      }
    }

    return page;
  }

  async getWorkspacePages(
    workspaceId: string,
    userId: string,
    options: { parentId?: string; favorites?: boolean } = {}
  ): Promise<IPageDocument[]> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const query: Record<string, unknown> = {
      workspace: workspaceId,
      isArchived: false,
    };

    if (options.favorites) {
      query.isFavorite = true;
    } else if (options.parentId) {
      query.parent = options.parentId;
    } else {
      query.parent = null; // Root level pages
    }

    return Page.find(query)
      .populate('createdBy', 'name email avatar')
      .sort({ position: 1 });
  }

  async updatePage(
    pageId: string,
    data: UpdatePageInput,
    userId: string
  ): Promise<IPageDocument> {
    const page = await Page.findById(pageId);
    if (!page) {
      throw ApiError.notFound('Page not found');
    }

    const workspace = await Workspace.findById(page.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot update pages');
    }

    // Handle parent change
    if (data.parentId !== undefined) {
      if (data.parentId === pageId) {
        throw ApiError.badRequest('Page cannot be its own parent');
      }

      if (data.parentId) {
        const newParent = await Page.findById(data.parentId);
        if (!newParent || newParent.workspace.toString() !== page.workspace.toString()) {
          throw ApiError.notFound('Parent page not found');
        }

        // Check for circular reference
        let current = newParent;
        while (current.parent) {
          if (current.parent.toString() === pageId) {
            throw ApiError.badRequest('Circular reference detected');
          }
          current = await Page.findById(current.parent) as IPageDocument;
          if (!current) break;
        }
      }
    }

    const updateData = { ...data, lastEditedBy: userId };

    const updatedPage = await Page.findByIdAndUpdate(
      pageId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar');

    if (!updatedPage) {
      throw ApiError.notFound('Page not found');
    }

    await this.logAudit(userId, 'page.update', pageId, page.workspace.toString(), {
      updatedFields: Object.keys(data),
    });

    return updatedPage;
  }

  async movePage(
    pageId: string,
    data: MovePageInput,
    userId: string
  ): Promise<IPageDocument> {
    const page = await Page.findById(pageId);
    if (!page) {
      throw ApiError.notFound('Page not found');
    }

    const workspace = await Workspace.findById(page.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot move pages');
    }

    const oldParent = page.parent?.toString() || null;
    const newParent = data.parentId || null;
    const oldPosition = page.position;
    const newPosition = data.position;

    // Validate new parent
    if (newParent) {
      if (newParent === pageId) {
        throw ApiError.badRequest('Page cannot be its own parent');
      }

      const parentPage = await Page.findById(newParent);
      if (!parentPage || parentPage.workspace.toString() !== page.workspace.toString()) {
        throw ApiError.notFound('Parent page not found');
      }
    }

    if (oldParent === newParent) {
      // Moving within same parent
      if (newPosition > oldPosition) {
        await Page.updateMany(
          {
            workspace: page.workspace,
            parent: oldParent,
            position: { $gt: oldPosition, $lte: newPosition },
            isArchived: false,
          },
          { $inc: { position: -1 } }
        );
      } else if (newPosition < oldPosition) {
        await Page.updateMany(
          {
            workspace: page.workspace,
            parent: oldParent,
            position: { $gte: newPosition, $lt: oldPosition },
            isArchived: false,
          },
          { $inc: { position: 1 } }
        );
      }
    } else {
      // Moving to different parent
      await Page.updateMany(
        {
          workspace: page.workspace,
          parent: oldParent,
          position: { $gt: oldPosition },
          isArchived: false,
        },
        { $inc: { position: -1 } }
      );

      await Page.updateMany(
        {
          workspace: page.workspace,
          parent: newParent,
          position: { $gte: newPosition },
          isArchived: false,
        },
        { $inc: { position: 1 } }
      );

      page.parent = newParent as any;
    }

    page.position = newPosition;
    page.lastEditedBy = userId as any;
    await page.save();

    return page;
  }

  async deletePage(pageId: string, userId: string): Promise<void> {
    const page = await Page.findById(pageId);
    if (!page) {
      throw ApiError.notFound('Page not found');
    }

    const workspace = await Workspace.findById(page.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot delete pages');
    }

    // Archive page and all children recursively
    await this.archivePageRecursively(pageId);

    await this.logAudit(userId, 'page.delete', pageId, page.workspace.toString(), {
      title: page.title,
    });
  }

  private async archivePageRecursively(pageId: string): Promise<void> {
    const page = await Page.findById(pageId);
    if (!page) return;

    page.isArchived = true;
    await page.save();

    const children = await Page.find({ parent: pageId });
    for (const child of children) {
      await this.archivePageRecursively(child._id.toString());
    }
  }

  async duplicatePage(
    pageId: string,
    includeChildren: boolean,
    userId: string
  ): Promise<IPageDocument> {
    const page = await Page.findById(pageId);
    if (!page) {
      throw ApiError.notFound('Page not found');
    }

    const workspace = await Workspace.findById(page.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot duplicate pages');
    }

    const duplicated = await this.duplicatePageRecursively(
      page,
      page.parent?.toString(),
      userId,
      includeChildren
    );

    return duplicated;
  }

  private async duplicatePageRecursively(
    page: IPageDocument,
    parentId: string | undefined,
    userId: string,
    includeChildren: boolean
  ): Promise<IPageDocument> {
    const lastPage = await Page.findOne({
      workspace: page.workspace,
      parent: parentId || null,
    })
      .sort({ position: -1 })
      .select('position');

    const newPage = await Page.create({
      title: `${page.title} (Copy)`,
      content: page.content,
      workspace: page.workspace,
      parent: parentId,
      icon: page.icon,
      cover: page.cover,
      position: (lastPage?.position ?? -1) + 1,
      createdBy: userId,
      lastEditedBy: userId,
    });

    if (includeChildren) {
      const children = await Page.find({ parent: page._id, isArchived: false });
      for (const child of children) {
        await this.duplicatePageRecursively(
          child,
          newPage._id.toString(),
          userId,
          true
        );
      }
    }

    return newPage;
  }

  async searchPages(
    workspaceId: string,
    query: string,
    userId: string
  ): Promise<IPageDocument[]> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    return Page.find({
      workspace: workspaceId,
      isArchived: false,
      $text: { $search: query },
    })
      .populate('createdBy', 'name email avatar')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);
  }

  private async logAudit(
    userId: string,
    action: string,
    resourceId: string,
    workspaceId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await AuditLog.create({
        user: userId,
        action,
        resource: 'Page',
        resourceId,
        workspace: workspaceId,
        details,
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

export const pageService = new PageService();
