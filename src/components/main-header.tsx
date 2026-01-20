export function MainHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Wrap <header> in a <div> with 'sticky' positioning to make it follow the
  // overscroll behavior of the page. Otherwise, the header would need to have
  // 'absolute' (not 'sticky' since that would make the <header> disappear when
  // scrolling) positioning which would make it ignore overscroll behavior.
  return (
    <div className="sticky top-0 z-50">
      <header className={className}>{children}</header>
    </div>
  );
}
