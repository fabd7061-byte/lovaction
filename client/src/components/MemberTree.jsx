import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronsDownUp, ChevronsUpDown, Minus, Plus, RotateCcw, Search, X } from "lucide-react";
import Avatar from "./ui/Avatar.jsx";
import Badge from "./ui/Badge.jsx";
import { EmptyState } from "./ui/Feedback.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const ROLE_LABEL = { founder: "status.founder", admin: "status.admin", member: "status.member" };

function collectNodes(nodes, parent = null, depth = 0, out = []) {
  nodes.forEach((node) => {
    out.push({ node, depth, parentId: parent });
    collectNodes(node.children || [], node.id, depth + 1, out);
  });
  return out;
}

export default function MemberTree({
  tree = [],
  currentUserId,
  focusId,
  className = "",
  compact = false,
  linkTo,
}) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, x: 0, y: 0, left: 0, top: 0 });
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(compact ? 0.82 : 0.95);
  const [collapsed, setCollapsed] = useState(new Set());
  const [dragging, setDragging] = useState(false);

  const flat = useMemo(() => collectNodes(tree), [tree]);
  const parentMap = useMemo(() => {
    const map = new Map();
    flat.forEach(({ node, parentId }) => map.set(node.id, parentId));
    return map;
  }, [flat]);

  const withChildren = useMemo(
    () => new Set(flat.filter(({ node }) => node.children?.length).map(({ node }) => node.id)),
    [flat]
  );

  useEffect(() => {
    const next = new Set();
    flat.forEach(({ node, depth }) => {
      if (depth >= 1 && node.children?.length) next.add(node.id);
    });

    const focus = focusId || currentUserId;
    if (focus && parentMap.has(focus)) {
      let cursor = parentMap.get(focus);
      const seen = new Set();
      while (cursor && !seen.has(cursor)) {
        next.delete(cursor);
        seen.add(cursor);
        cursor = parentMap.get(cursor);
      }
    }
    setCollapsed(next);
    // Only reset when the tree or focus changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, focusId, currentUserId]);

  const normalized = query.trim().toLowerCase();
  const matchedIds = useMemo(() => {
    if (!normalized) return null;
    return new Set(
      flat
        .filter(({ node }) =>
          [node.fullName, node.username, node.memberCode]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalized))
        )
        .map(({ node }) => node.id)
    );
  }, [flat, normalized]);

  const relevantIds = useMemo(() => {
    if (!matchedIds) return null;
    const set = new Set();
    matchedIds.forEach((id) => {
      let cursor = id;
      const seen = new Set();
      while (cursor && !seen.has(cursor)) {
        seen.add(cursor);
        set.add(cursor);
        cursor = parentMap.get(cursor);
      }
    });
    return set;
  }, [matchedIds, parentMap]);

  const toggle = (id) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(withChildren));

  const zoomBy = (delta) => setZoom((z) => Math.min(1.5, Math.max(0.45, Number((z + delta).toFixed(2)))));

  const resetView = () => {
    setZoom(0.95);
    setQuery("");
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.scrollTo({
        left: Math.max(0, canvas.scrollWidth / 2 - canvas.clientWidth / 2),
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (!focusId && !currentUserId) return;
    const id = focusId || currentUserId;
    const timer = window.setTimeout(() => {
      const node = document.getElementById(`tree-node-${id}`);
      if (node) node.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [focusId, currentUserId, tree]);

  const onPointerDown = (event) => {
    if (event.target.closest("button, a, input")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    dragRef.current = {
      active: true,
      moved: false,
      x: event.clientX,
      y: event.clientY,
      left: canvas.scrollLeft,
      top: canvas.scrollTop,
    };
    setDragging(true);
    canvas.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag.active || !canvas) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    canvas.scrollLeft = drag.left - dx;
    canvas.scrollTop = drag.top - dy;
  };

  const endDrag = (event) => {
    const canvas = canvasRef.current;
    if (canvas?.releasePointerCapture && event?.pointerId !== undefined) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released.
      }
    }
    dragRef.current.active = false;
    setDragging(false);
  };

  const renderNode = (node) => {
    if (relevantIds && !relevantIds.has(node.id)) return null;

    const children = node.children || [];
    const isMatch = matchedIds?.has(node.id);
    const searching = Boolean(matchedIds);
    const isCollapsed = searching ? false : collapsed.has(node.id);
    const isCurrent = String(node.id) === String(currentUserId);
    const isFounder = node.role === "founder";
    const showChildren = children.length > 0 && !isCollapsed;

    return (
      <li key={node.id}>
        <div
          id={`tree-node-${node.id}`}
          className={`tree-node-card ${isCurrent ? "is-current" : ""} ${isMatch ? "is-match" : ""} ${
            isFounder ? "is-founder" : ""
          } ${searching && !isMatch && !matchedIds?.has(node.id) ? "opacity-65" : ""}`}
        >
          <div className="flex justify-center">
            <Avatar
              src={node.profileImage}
              firstName={node.firstName}
              lastName={node.lastName}
              size={isFounder ? "lg" : "md"}
              ring={isCurrent}
            />
          </div>
          <p className="mt-2.5 truncate font-display text-[13.5px] font-semibold leading-tight text-cream">
            {node.fullName}
          </p>
          <p className="mt-0.5 truncate text-[9.5px] text-white/35">@{node.username}</p>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <Badge status={node.role} dark label={t(ROLE_LABEL[node.role] || "status.member")} dot={false} />
            {isCurrent && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.08em] text-ink">
                {t("members.youAreHere")}
              </span>
            )}
          </div>
          <p className="mt-2 text-[9.5px] text-white/30">
            <span className="font-semibold text-gold-light/80">{node.referralsCount || 0}</span>{" "}
            {t("members.referrals")}
          </p>
          {linkTo && (
            <Link
              to={linkTo(node)}
              className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-gold-light/60 transition hover:text-gold-light"
            >
              {t("common.viewProfile")}
            </Link>
          )}

          {children.length > 0 && (
            <button
              type="button"
              className="tree-collapse"
              onClick={() => toggle(node.id)}
              aria-label={isCollapsed ? t("members.expandAll") : t("members.collapseAll")}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? "+" : "−"}
            </button>
          )}
        </div>

        {showChildren && <ul>{children.map((child) => renderNode(child))}</ul>}
      </li>
    );
  };

  const treeContent = tree.length ? (
    <div
      className="tree-wrap"
      style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform .25s ease" }}
    >
      <ul className="tree">{tree.map((node) => renderNode(node))}</ul>
    </div>
  ) : (
    <EmptyState
      dark
      title={t("members.treeEmpty")}
      text={t("members.treeText")}
      action={
        <Link
          to="/join"
          className="btn btn-gold btn-sm"
        >
          {t("nav.join")}
        </Link>
      }
    />
  );

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-card ${className}`}>
      <div className="flex flex-col gap-2.5 border-b border-white/[0.07] bg-ink-soft/70 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("members.searchPlaceholder")}
            className="h-9 w-full rounded-full border border-white/10 bg-white/[0.04] pl-9 pr-9 text-[11.5px] text-cream placeholder:text-white/25 focus:border-gold/50 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("common.clear")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/30 transition hover:text-cream"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          {normalized && (
            <span className="text-[10px] font-medium text-gold-light/70">
              {matchedIds?.size || 0} {t("common.search")}
            </span>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => zoomBy(-0.1)}
              aria-label={t("members.zoomOut")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-gold/40 hover:text-cream"
            >
              <Minus size={13} />
            </button>
            <span className="w-9 text-center text-[10px] font-semibold text-white/45">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => zoomBy(0.1)}
              aria-label={t("members.zoomIn")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-gold/40 hover:text-cream"
            >
              <Plus size={13} />
            </button>
            <span className="mx-1 h-4 w-px bg-white/10" />
            <button
              type="button"
              onClick={expandAll}
              aria-label={t("members.expandAll")}
              title={t("members.expandAll")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-gold/40 hover:text-cream"
            >
              <ChevronsUpDown size={13} />
            </button>
            <button
              type="button"
              onClick={collapseAll}
              aria-label={t("members.collapseAll")}
              title={t("members.collapseAll")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-gold/40 hover:text-cream"
            >
              <ChevronsDownUp size={13} />
            </button>
            <button
              type="button"
              onClick={resetView}
              aria-label={t("members.reset")}
              title={t("members.reset")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-gold/40 hover:text-cream"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={canvasRef}
        className={`tree-canvas select-none ${dragging ? "is-dragging" : ""} ${
          compact ? "max-h-[460px]" : "h-[68vh] min-h-[460px] max-h-[820px]"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(event) => {
          if (dragRef.current.active && event.buttons === 0) endDrag(event);
        }}
      >
        {relevantIds && matchedIds?.size === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Search size={22} className="text-gold/50" />
            <p className="text-[12px] text-white/50">{t("members.noMatch", { query })}</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-1 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/50 transition hover:text-cream"
            >
              {t("common.clear")}
            </button>
          </div>
        ) : (
          treeContent
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-ink-soft/60 px-4 py-2.5 text-[9px] text-white/30">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> {t("members.legendFounder")}</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-crimson" /> {t("members.legendAdmin")}</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white/30" /> {t("members.legendMember")}</span>
        </div>
        <span className="hidden sm:inline">{t("members.dragHint")}</span>
      </div>
    </div>
  );
}
