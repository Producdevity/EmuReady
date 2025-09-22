interface CommentWithParent {
  id: string
  parentId: string | null
  createdAt: Date
}

export type CommentTreeNode<T extends CommentWithParent> = T & {
  replies: CommentTreeNode<T>[]
  replyCount: number
}

interface BuildOptions {
  replySort?: 'asc' | 'desc'
}

export function buildCommentTree<T extends CommentWithParent>(
  comments: readonly T[],
  options: BuildOptions = {},
): CommentTreeNode<T>[] {
  const nodes = new Map<string, CommentTreeNode<T>>()
  const roots: CommentTreeNode<T>[] = []
  const sortDirection = options.replySort === 'desc' ? 'desc' : 'asc'

  for (const comment of comments) {
    nodes.set(comment.id, {
      ...(comment as T),
      replies: [],
      replyCount: 0,
    })
  }

  for (const node of nodes.values()) {
    if (node.parentId) {
      const parent = nodes.get(node.parentId)
      if (parent) {
        parent.replies.push(node)
        continue
      }
    }
    roots.push(node)
  }

  const sortFn = (a: CommentTreeNode<T>, b: CommentTreeNode<T>) => {
    const left = a.createdAt.getTime()
    const right = b.createdAt.getTime()
    return sortDirection === 'asc' ? left - right : right - left
  }

  const sortAndCount = (list: CommentTreeNode<T>[]) => {
    list.sort(sortFn)
    for (const child of list) {
      sortAndCount(child.replies)
      child.replyCount = child.replies.length
    }
  }

  sortAndCount(roots)

  return roots
}

export function findCommentWithParent<T extends CommentWithParent>(
  nodes: CommentTreeNode<T>[],
  targetId: string,
  parent: CommentTreeNode<T> | null = null,
): { comment: CommentTreeNode<T>; parent: CommentTreeNode<T> | null } | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return { comment: node, parent }
    }

    const match = findCommentWithParent(node.replies, targetId, node)
    if (match) return match
  }

  return null
}
