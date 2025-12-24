"use client";

import Link from "next/link";

interface UserCardProps {
  user: {
    id: string;
    name: string | null;
    photo_url: string | null;
    bio: string | null;
    skills: string[] | null;
  };
  showSkills?: boolean;
  highlightedSkills?: string[];
}

export default function UserCard({
  user,
  showSkills = true,
  highlightedSkills = [],
}: UserCardProps) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <Link href={`/profile/${user.id}`}>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer h-full">
        {/* Avatar */}
        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full mb-3 flex items-center justify-center text-white font-bold overflow-hidden">
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.name || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm truncate">
          {user.name || "Anonymous"}
        </h3>

        {/* Bio (truncated) */}
        {user.bio && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {user.bio}
          </p>
        )}

        {/* Skills tags */}
        {showSkills && user.skills && user.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {user.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className={`text-xs px-2 py-1 rounded-full ${
                  highlightedSkills.includes(skill)
                    ? "bg-[#F4A261]/30 text-[#a66b3d] font-medium"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {skill}
              </span>
            ))}
            {user.skills.length > 3 && (
              <span className="text-xs text-gray-400">
                +{user.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
