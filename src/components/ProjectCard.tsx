interface Project {
  id: string;
  title: string;
  description: string | null;
  media_urls: string[] | null;
}

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  showEditButton?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ProjectCard({
  project,
  onClick,
  showEditButton = false,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  return (
    <div
      className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer relative group"
      onClick={onClick}
    >
      {/* Media thumbnail */}
      {project.media_urls?.[0] ? (
        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
          <img
            src={project.media_urls[0]}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
          <span className="text-gray-400 text-2xl">+</span>
        </div>
      )}

      {/* Title & description */}
      <h3 className="font-medium">{project.title}</h3>
      {project.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Edit/Delete buttons (shown on hover when editing is enabled) */}
      {showEditButton && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="bg-white/90 backdrop-blur text-gray-700 p-2 rounded-full hover:bg-white transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="bg-white/90 backdrop-blur text-red-600 p-2 rounded-full hover:bg-white transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
