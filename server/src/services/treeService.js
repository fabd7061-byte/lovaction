import User from "../models/User.js";
import Referral from "../models/Referral.js";

export const TREE_FIELDS =
  "firstName lastName username memberCode role profileImage joinedAt parentMemberId points";

/**
 * Returns a nested, public-safe member tree for all active members.
 * Referral counts come from approved referral records.
 */
export async function buildMemberTree() {
  const [users, counts] = await Promise.all([
    User.find({ status: "active" }).select(TREE_FIELDS).sort({ joinedAt: 1 }).lean(),
    Referral.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const nodeMap = new Map();
  for (const user of users) {
    nodeMap.set(String(user._id), {
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      memberCode: user.memberCode,
      role: user.role,
      profileImage: user.profileImage,
      phone: undefined,
      email: undefined,
      joinedAt: user.joinedAt,
      referralsCount: countMap.get(String(user._id)) || 0,
      children: [],
    });
  }

  const roots = [];
  for (const user of users) {
    const node = nodeMap.get(String(user._id));
    const parent = user.parentMemberId
      ? nodeMap.get(String(user.parentMemberId))
      : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const priority = { founder: 0, admin: 1, member: 2 };
  const sortNodes = (nodes) => {
    nodes.sort(
      (a, b) =>
        (priority[a.role] ?? 3) - (priority[b.role] ?? 3) ||
        new Date(a.joinedAt) - new Date(b.joinedAt)
    );
    nodes.forEach((n) => sortNodes(n.children));
    return nodes;
  };

  sortNodes(roots);
  return roots;
}

/** Finds a member's ancestor chain, from root to the member. */
export async function getAncestorPath(memberId) {
  const path = [];
  let currentId = memberId;
  const seen = new Set();
  while (currentId && !seen.has(String(currentId))) {
    seen.add(String(currentId));
    const user = await User.findById(currentId)
      .select("firstName lastName username role profileImage parentMemberId")
      .lean();
    if (!user) break;
    path.unshift({
      id: String(user._id),
      fullName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      role: user.role,
      profileImage: user.profileImage,
    });
    currentId = user.parentMemberId;
  }
  return path;
}

/** Returns the subtree rooted at memberId as a nested object. */
export async function buildSubtree(memberId) {
  const roots = await buildMemberTree();
  const find = (nodes) => {
    for (const node of nodes) {
      if (node.id === String(memberId)) return node;
      const found = find(node.children);
      if (found) return found;
    }
    return null;
  };
  return find(roots);
}
