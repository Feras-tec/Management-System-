type BrandLogoProps = {
  className?: string;
  title?: string;
};

export function BrandLogo({
  className = "size-16",
  title = "AutoCare",
}: BrandLogoProps) {
  return (
    <img
      src="/brand/autocare-badge.svg"
      width={370}
      height={370}
      alt={title}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

export default BrandLogo;
