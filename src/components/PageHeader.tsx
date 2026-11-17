import Icon, { IconName } from "./Icon";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
}) {
  return (
    <div className="text-center mb-12 animate-fadeUp">
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="h-px w-10 bg-navy-200" />
        <span className="eyebrow">{eyebrow}</span>
        <span className="h-px w-10 bg-navy-200" />
      </div>
      <h1 className="font-display text-4xl md:text-5xl text-navy-950 text-balance leading-tight">
        {icon && (
          <span className="inline-flex align-[-4px] mr-3 text-navy-800">
            <Icon name={icon} size={34} strokeWidth={1.5} />
          </span>
        )}
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 text-navy-500 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="ornament mt-7">
        <span className="text-xs">✦</span>
      </div>
    </div>
  );
}
