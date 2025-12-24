"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface Match {
  helper: { name: string; linkedin: string; superpowers?: string[] };
  helped: { name: string; linkedin: string; needs?: string[] };
  person_a?: { name: string; linkedin: string; project?: string };
  person_b?: { name: string; linkedin: string; project?: string };
  third_person?: { name: string; linkedin: string };
  reason: string;
  similarity_reason?: string;
  score: number;
  is_trio: boolean;
}

interface Round {
  round: number;
  type: string;
  matches: Match[];
}

interface MatchData {
  rounds: Round[];
}

interface PersonMatch {
  round: number;
  type: string;
  partner: { name: string; linkedin: string };
  thirdPerson?: { name: string; linkedin: string };
  role: string;
  reason: string;
  score: number;
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";
  const [matches, setMatches] = useState<PersonMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/matches.json")
      .then((res) => res.json())
      .then((data: MatchData) => {
        const personMatches: PersonMatch[] = [];

        data.rounds.forEach((round) => {
          round.matches.forEach((match) => {
            const searchName = name.toLowerCase();

            if (round.type === "complementary") {
              // Check if person is helper
              if (match.helper.name.toLowerCase().includes(searchName)) {
                personMatches.push({
                  round: round.round,
                  type: round.type,
                  partner: match.helped,
                  thirdPerson: match.third_person,
                  role: "Helper",
                  reason: match.reason,
                  score: match.score,
                });
              }
              // Check if person is helped
              else if (match.helped.name.toLowerCase().includes(searchName)) {
                personMatches.push({
                  round: round.round,
                  type: round.type,
                  partner: match.helper,
                  thirdPerson: match.third_person,
                  role: "Getting Help",
                  reason: match.reason,
                  score: match.score,
                });
              }
              // Check if person is third in trio
              else if (match.third_person?.name.toLowerCase().includes(searchName)) {
                personMatches.push({
                  round: round.round,
                  type: round.type,
                  partner: match.helper,
                  thirdPerson: match.helped,
                  role: "Trio",
                  reason: match.reason,
                  score: match.score,
                });
              }
            } else {
              // Similarity round
              if (match.person_a?.name.toLowerCase().includes(searchName)) {
                personMatches.push({
                  round: round.round,
                  type: "peer",
                  partner: match.person_b!,
                  role: "Peer",
                  reason: match.similarity_reason || match.reason,
                  score: match.score,
                });
              } else if (match.person_b?.name.toLowerCase().includes(searchName)) {
                personMatches.push({
                  round: round.round,
                  type: "peer",
                  partner: match.person_a!,
                  role: "Peer",
                  reason: match.similarity_reason || match.reason,
                  score: match.score,
                });
              }
            }
          });
        });

        setMatches(personMatches);
        setLoading(false);
      });
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-gray-500 hover:text-gray-700 mb-8 inline-block">
          &larr; Back to search
        </Link>

        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
          Matches for &ldquo;{name}&rdquo;
        </h1>
        <p className="text-gray-500 mb-8">
          {matches.length} matches across 4 rounds
        </p>

        {matches.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-gray-500">No matches found for that name.</p>
            <p className="text-gray-400 text-sm mt-2">Try searching with a different spelling.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-sm text-gray-400">Round {match.round}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      match.role === "Helper"
                        ? "bg-green-100 text-green-700"
                        : match.role === "Getting Help"
                        ? "bg-blue-100 text-blue-700"
                        : match.role === "Trio"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {match.role}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    Score: {match.score}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-1">
                  {match.partner.name}
                  {match.thirdPerson && (
                    <span className="text-gray-400 font-normal"> + {match.thirdPerson.name}</span>
                  )}
                </h3>

                {match.partner.linkedin && (
                  <a
                    href={match.partner.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#F4A261] hover:underline"
                  >
                    View LinkedIn &rarr;
                  </a>
                )}

                <p className="text-gray-600 mt-4 text-sm">{match.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <MatchesContent />
    </Suspense>
  );
}
