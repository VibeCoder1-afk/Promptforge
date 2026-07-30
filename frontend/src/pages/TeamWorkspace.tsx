import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Copy } from "lucide-react";
import { api } from "../lib/api";

type Team = { _id: string; name: string; inviteCode: string; members: { _id: string; name: string; email: string; avatarColor: string }[] };

export default function TeamWorkspace() {
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const { data } = useQuery({
    queryKey: ["myTeam"],
    queryFn: async () => (await api.get<{ team: Team | null }>("/teams/me")).data.team,
  });

  const createMutation = useMutation({
    mutationFn: async () => (await api.post("/teams", { name: teamName })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myTeam"] }),
  });

  const joinMutation = useMutation({
    mutationFn: async () => (await api.post("/teams/join", { inviteCode })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myTeam"] }),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => (await api.post("/teams/leave")).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myTeam"] }),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Users size={22} /> Team Workspace
      </h1>

      {!data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4 space-y-3">
            <p className="text-sm font-medium">Create a team</p>
            <input className="input" placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
            <button className="btn-primary w-full" onClick={() => createMutation.mutate()}>
              Create team
            </button>
          </div>
          <div className="card p-4 space-y-3">
            <p className="text-sm font-medium">Join with invite code</p>
            <input className="input" placeholder="Invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
            <button className="btn-primary w-full" onClick={() => joinMutation.mutate()}>
              Join team
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{data.name}</h2>
            <button className="text-xs text-coral" onClick={() => leaveMutation.mutate()}>
              Leave team
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-500">Invite code:</span>
            <span className="font-mono pill bg-base-700">{data.inviteCode}</span>
            <button onClick={() => navigator.clipboard.writeText(data.inviteCode)} className="text-ink-500 hover:text-signal-soft">
              <Copy size={14} />
            </button>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-ink-500 mb-2">Members</p>
            <div className="space-y-2">
              {data.members.map((m) => (
                <div key={m._id} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <span>{m.name}</span>
                  <span className="text-ink-500 text-xs">{m.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
