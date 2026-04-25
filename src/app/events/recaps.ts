export type EventRecap = {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  hosts: string[];
  description: string;
  coverImage: string;
  photos?: string[];
  links?: { label: string; url: string }[];
};

export const recaps: EventRecap[] = [
  {
    id: "claude-code-workshop",
    title: "MakersLounge Toronto #10: Claude Code Workshop",
    date: "2026-04-24",
    location: "Toronto Metropolitan University Student Centre",
    attendees: 49,
    hosts: [
      "Berto Mill",
      "Vimal Kumar Parthasarathy",
      "Katy Rozanova",
      "Parth Pawa",
      "Yeji Lee",
    ],
    description:
      "A hands-on Claude Code workshop and build night for non-technical founders, creators, and anyone curious about building software with AI. Vimal walked the room through Claude Code from first principles — plan mode, CLAUDE.md, plugins, subagents — then everyone jumped into a guided build session and shipped something real before the night was out. Closed out with live demos and feedback from 49 makers in the room.",
    coverImage: "/recaps/claude-code-workshop/1.jpg",
    photos: [
      "/recaps/claude-code-workshop/1.jpg",
      "/recaps/claude-code-workshop/2.jpg",
      "/recaps/claude-code-workshop/3.jpg",
    ],
    links: [
      { label: "Luma event", url: "https://lu.ma/dha22n2c" },
      {
        label: "Slides & cheat sheet",
        url: "https://drive.google.com/drive/folders/1JZ2xzz4TkBh7zGSZNUXMT1cwxXx0BAZo",
      },
    ],
  },
];
