import { Avatar } from "@/components/Avatar";

type Person = { name: string; avatar_url: string | null };

export function AvatarStack({
  people,
  size = 28,
  max = 5,
}: {
  people: Person[];
  size?: number;
  max?: number;
}) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <div key={i} className="rounded-full ring-2 ring-white" style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}>
          <Avatar name={p.name} src={p.avatar_url} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-panel border border-hairline ring-2 ring-white text-secondary font-mono-tag"
          style={{ width: size, height: size, fontSize: size * 0.32, marginLeft: -size * 0.35 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
