import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type DiscordServer, type GroupInfo } from '@keebmeet/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { FaDiscord } from 'react-icons/fa';
import {
  FiAlertTriangle,
  FiEdit2,
  FiInfo,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { CopyButton } from '../components/CopyButton';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { ExpandableCard } from '../components/ExpandableCard';
import {
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useEditGroupMutation,
  useGetBotDiscordServersQuery,
  useGetGroupsQuery,
} from '../store/groupSlice';

// Radix Select can't use an empty string as an item value, so "no server" gets
// this sentinel, mapped back to '' in the form.
const NO_SERVER = 'none';

interface GroupForm {
  name: string;
  code: string;
  discord_server_id: string;
}

const emptyForm: GroupForm = { name: '', code: '', discord_server_id: '' };

// Renders a group's Discord server as its resolved name, with an info tooltip
// exposing the raw server id. Falls back gracefully while the server list loads
// and when the id can't be matched (bot removed, server deleted).
const DiscordServerCell = ({
  serverId,
  servers,
  isLoadingServers,
}: {
  serverId: string | null;
  servers: DiscordServer[] | undefined;
  isLoadingServers: boolean;
}): ReactNode => {
  if (serverId == null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const match = servers?.find((server) => server.id === serverId);
  const label =
    match != null ? (
      match.name
    ) : isLoadingServers ? (
      <span className="text-muted-foreground italic">Loading…</span>
    ) : (
      <span className="inline-flex items-center gap-1 text-amber-600">
        <FiAlertTriangle className="size-3.5 shrink-0" />
        Bot not in this server
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Show Discord server ID"
          >
            <FiInfo className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <span className="font-mono">{serverId}</span>
        </TooltipContent>
      </Tooltip>
    </span>
  );
};

const AdminGroupsPage = (): ReactNode => {
  const { data: groups, isLoading } = useGetGroupsQuery();
  const { data: discordServers, isLoading: isLoadingServers } =
    useGetBotDiscordServersQuery();
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [editGroup, { isLoading: isEditing }] = useEditGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();

  // The group being edited, or null when the dialog is creating a new one. The
  // dialog opens whenever `form` is non-null.
  const [editing, setEditing] = useState<GroupInfo | null>(null);
  const [form, setForm] = useState<GroupForm | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GroupInfo | null>(null);

  const isSaving = isCreating || isEditing;

  const openCreate = (): void => {
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (group: GroupInfo): void => {
    setEditing(group);
    setForm({
      name: group.name,
      code: group.code,
      discord_server_id: group.discord_server_id ?? '',
    });
  };

  const closeDialog = (): void => {
    setForm(null);
    setEditing(null);
  };

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (form == null) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      discord_server_id: form.discord_server_id.trim(),
    };

    void (async () => {
      try {
        if (editing != null) {
          await editGroup({ groupId: editing.id, changes: payload }).unwrap();
          toast.success(`Updated ${payload.name}.`);
        } else {
          await createGroup(payload).unwrap();
          toast.success(`Created ${payload.name}.`);
        }
        closeDialog();
      } catch (err) {
        // The API rejects a duplicate code with a 409.
        const status = (err as { status?: number }).status;
        if (status === 409) {
          toast.error('That group code is already taken.');
        } else {
          toast.error('Could not save the group. Please try again.');
        }
      }
    })();
  };

  const onDelete = (): void => {
    if (pendingDelete == null) return;
    void (async () => {
      try {
        await deleteGroup(pendingDelete.id).unwrap();
        toast.success(`Deleted ${pendingDelete.name}.`);
        setPendingDelete(null);
      } catch {
        toast.error('Could not delete the group. Please try again.');
      }
    })();
  };

  const columns: Array<DataTableColumn<GroupInfo>> = [
    {
      id: 'name',
      header: 'Name',
      sortLabel: 'Name',
      sortValue: (group) => group.name,
      cellClassName: 'font-medium',
      cell: (group) => group.name,
    },
    {
      id: 'code',
      header: 'Code',
      sortLabel: 'Code',
      sortValue: (group) => group.code,
      cellClassName: 'text-muted-foreground font-mono',
      cell: (group) => (
        <span className="inline-flex items-center gap-1">
          {group.code}
          <CopyButton
            value={group.code}
            label={`Copy code ${group.code}`}
            toastMessage="Code copied to clipboard"
            className="size-6"
          />
        </span>
      ),
    },
    {
      id: 'discord',
      header: 'Discord server',
      cellClassName: 'text-muted-foreground',
      cell: (group) => (
        <DiscordServerCell
          serverId={group.discord_server_id}
          servers={discordServers}
          isLoadingServers={isLoadingServers}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (group) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEdit(group)}
            aria-label={`Edit ${group.name}`}
          >
            <FiEdit2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPendingDelete(group)}
            aria-label={`Delete ${group.name}`}
          >
            <FiTrash2 />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
      <DataTable
        title="Manage groups"
        headerActions={
          <Button
            onClick={openCreate}
            size="icon"
            aria-label="Create new group"
            variant="ghost"
          >
            <FiPlus />
          </Button>
        }
        data={groups}
        columns={columns}
        getRowId={(group) => group.id}
        initialSort={{ columnId: 'name', direction: 'asc' }}
        search={{
          placeholder: 'Search groups…',
          getText: (group) => `${group.name} ${group.code}`,
        }}
        emptyMessage={({ hasRows }) =>
          hasRows
            ? 'No groups match your search.'
            : 'No groups yet. Create one to get started.'
        }
        renderCard={(group, { expanded, toggle }) => (
          <ExpandableCard
            title={group.name}
            subtitle={<span className="font-mono">{group.code}</span>}
            trailing={
              group.discord_server_id != null ? (
                <FaDiscord
                  className="size-4 shrink-0 text-[#5865F2]"
                  aria-label={`${group.name} has a Discord server`}
                />
              ) : null
            }
            expanded={expanded}
            onToggle={toggle}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-sm">Code</span>
              <span className="inline-flex items-center gap-1 font-mono">
                {group.code}
                <CopyButton
                  value={group.code}
                  label={`Copy code ${group.code}`}
                  toastMessage="Code copied to clipboard"
                  className="size-6"
                />
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-sm">
                Discord server
              </span>
              <DiscordServerCell
                serverId={group.discord_server_id}
                servers={discordServers}
                isLoadingServers={isLoadingServers}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => openEdit(group)}
              >
                <FiEdit2 />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setPendingDelete(group)}
              >
                <FiTrash2 />
                Delete
              </Button>
            </div>
          </ExpandableCard>
        )}
      />

      {/* Create / edit dialog */}
      <Dialog
        open={form != null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing != null ? 'Edit group' : 'New group'}
              </DialogTitle>
              <DialogDescription>
                {editing != null
                  ? 'Update this group’s details.'
                  : 'Create a group with a unique code.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-name">Name</Label>
                <Input
                  id="group-name"
                  value={form?.name ?? ''}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev != null
                        ? { ...prev, name: event.target.value }
                        : prev
                    )
                  }
                  placeholder="Group name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-code">Code</Label>
                <Input
                  id="group-code"
                  value={form?.code ?? ''}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev != null
                        ? { ...prev, code: event.target.value }
                        : prev
                    )
                  }
                  placeholder="group-code"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-discord">Discord server</Label>
                <Select
                  value={
                    form?.discord_server_id != null &&
                    form.discord_server_id !== ''
                      ? form.discord_server_id
                      : NO_SERVER
                  }
                  onValueChange={(value) =>
                    setForm((prev) =>
                      prev != null
                        ? {
                            ...prev,
                            discord_server_id: value === NO_SERVER ? '' : value,
                          }
                        : prev
                    )
                  }
                >
                  <SelectTrigger id="group-discord" className="w-full">
                    <SelectValue placeholder="Select a server" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SERVER}>None</SelectItem>
                    {discordServers?.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))}
                    {/* The bot may have left a server this group still points
                        at; keep it selectable so editing doesn't silently drop
                        the association. */}
                    {form?.discord_server_id != null &&
                    form.discord_server_id !== '' &&
                    !(discordServers ?? []).some(
                      (server) => server.id === form.discord_server_id
                    ) ? (
                      <SelectItem value={form.discord_server_id}>
                        Unknown server ({form.discord_server_id})
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  form == null ||
                  form.name.trim().length < 3 ||
                  form.code.trim() === ''
                }
              >
                {editing != null ? 'Save' : 'Create'}
                {isSaving && <Spinner />}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete group</DialogTitle>
            <DialogDescription>
              {pendingDelete != null
                ? `Are you sure you want to delete ${pendingDelete.name}? This cannot be undone.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              Delete
              {isDeleting && <Spinner />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGroupsPage;
