import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { type User } from '@keebmeet/shared';
import dayjs from 'dayjs';
import { useState, type ReactNode } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { ExpandableCard } from '../components/ExpandableCard';
import { setUserAccess } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGetAllUsersQuery } from '../store/userSlice';

const AdminUsersPage = (): ReactNode => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.user);
  const { data: users, isLoading, refetch } = useGetAllUsersQuery();
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  // The user id currently being saved, so we can disable its row while in flight.
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  // An in-progress admin-status change awaiting password confirmation.
  const [pendingAdminChange, setPendingAdminChange] = useState<{
    user: User;
    nextValue: boolean;
  } | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');

  const updateAccess = async (
    user: User,
    changes: { isAdmin?: boolean; isOrganizer?: boolean },
    currentPassword?: string
  ): Promise<boolean> => {
    setSavingUserId(user.id);
    try {
      await dispatch(
        setUserAccess({
          userId: user.id,
          isAdmin: changes.isAdmin ?? user.is_admin,
          isOrganizer: changes.isOrganizer ?? user.is_organizer,
          currentPassword,
        })
      ).unwrap();
      await refetch();
      toast.success(`Updated ${user.display_name}.`);
      return true;
    } catch (err) {
      // The auth server rejects a wrong/missing password with a 401.
      if (currentPassword != null && err === 401) {
        toast.error('Incorrect password.');
      } else {
        toast.error(`Could not update ${user.display_name}. Please try again.`);
      }
      return false;
    } finally {
      setSavingUserId(null);
    }
  };

  // Toggling admin status requires the acting user to confirm with their own
  // password, so it goes through a confirmation dialog rather than firing
  // immediately.
  const confirmAdminChange = (): void => {
    if (pendingAdminChange == null) return;
    void (async () => {
      const succeeded = await updateAccess(
        pendingAdminChange.user,
        { isAdmin: pendingAdminChange.nextValue },
        confirmPassword
      );
      if (succeeded) {
        setPendingAdminChange(null);
      }
      setConfirmPassword('');
    })();
  };

  const closeAdminDialog = (): void => {
    setPendingAdminChange(null);
    setConfirmPassword('');
  };

  const accessFlags = (
    user: User
  ): { isSaving: boolean; isSelf: boolean; canEditAdmin: boolean } => {
    const isSaving = savingUserId === user.id;
    // Guard against removing your own elevated access and locking yourself out
    // of this page.
    const isSelf = currentUser?.id === user.id;
    const isOwner = currentUser?.isOwner ?? false;
    // Only owners may change owner status or an owner's admin status.
    const canEditAdmin = isOwner || !user.is_owner;
    return { isSaving, isSelf, canEditAdmin };
  };

  const roleBadges = (user: User): ReactNode => {
    const roles: Array<{
      label: string;
      variant: 'default' | 'secondary' | 'outline';
    }> = [];
    if (user.is_owner) roles.push({ label: 'Owner', variant: 'default' });
    if (user.is_admin) roles.push({ label: 'Admin', variant: 'secondary' });
    if (user.is_organizer)
      roles.push({ label: 'Organizer', variant: 'outline' });
    return roles.map((role) => (
      <Badge key={role.label} variant={role.variant}>
        {role.label}
      </Badge>
    ));
  };

  const discordIndicator = (user: User): ReactNode =>
    user.is_discord_linked ? (
      <FaDiscord
        className="size-4 text-[#5865F2]"
        aria-label={`${user.display_name} has Discord linked`}
      />
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  const ownerIndicator = (user: User): ReactNode =>
    user.is_owner ? (
      <FiCheck
        className="size-4"
        aria-label={`${user.display_name} is an owner`}
      />
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  const organizerSwitch = (user: User, isSaving: boolean): ReactNode => (
    <Switch
      checked={user.is_organizer}
      disabled={isSaving}
      onCheckedChange={(checked) => {
        void updateAccess(user, { isOrganizer: checked });
      }}
      aria-label={`Toggle organizer for ${user.display_name}`}
    />
  );

  const adminSwitch = (
    user: User,
    isSaving: boolean,
    isSelf: boolean,
    canEditAdmin: boolean
  ): ReactNode => (
    <Switch
      checked={user.is_admin}
      disabled={isSaving || isSelf || !canEditAdmin}
      onCheckedChange={(checked) => {
        setConfirmPassword('');
        setPendingAdminChange({ user, nextValue: checked });
      }}
      aria-label={`Toggle admin for ${user.display_name}`}
    />
  );

  const columns: Array<DataTableColumn<User>> = [
    {
      id: 'avatar',
      header: '',
      cell: (user) => (
        <Link
          to={`/user/${user.username}`}
          aria-label={`View ${user.display_name}'s profile`}
        >
          <Avatar>
            <AvatarImage
              src={user.photo_url}
              alt={`${user.display_name}'s avatar`}
            />
            <AvatarFallback>
              {user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      sortLabel: 'Name',
      sortValue: (user) => user.display_name,
      cellClassName: 'font-medium',
      cell: (user) => (
        <Link to={`/user/${user.username}`} className="hover:underline">
          {user.display_name}
        </Link>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      sortLabel: 'Email',
      sortValue: (user) => user.email,
      cellClassName: 'text-muted-foreground',
      cell: (user) => user.email,
    },
    {
      id: 'joined',
      header: 'Joined',
      sortLabel: 'Joined',
      sortValue: (user) => dayjs(user.created_at).valueOf(),
      cellClassName: 'text-muted-foreground whitespace-nowrap',
      cell: (user) => dayjs(user.created_at).format('MMM D, YYYY h:mm A'),
    },
    {
      id: 'discord',
      header: 'Discord',
      align: 'center',
      cell: (user) => (
        <div className="flex justify-center">{discordIndicator(user)}</div>
      ),
    },
    {
      id: 'organizer',
      header: 'Organizer',
      align: 'center',
      cell: (user) => organizerSwitch(user, accessFlags(user).isSaving),
    },
    {
      id: 'admin',
      header: 'Admin',
      align: 'center',
      cell: (user) => {
        const { isSaving, isSelf, canEditAdmin } = accessFlags(user);
        return adminSwitch(user, isSaving, isSelf, canEditAdmin);
      },
    },
    {
      id: 'owner',
      header: 'Owner',
      align: 'center',
      cell: (user) => (
        <div className="flex justify-center">{ownerIndicator(user)}</div>
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
        title="Manage users"
        data={users}
        columns={columns}
        getRowId={(user) => user.id}
        initialSort={{ columnId: 'joined', direction: 'desc' }}
        search={{
          placeholder: 'Search by name or email…',
          getText: (user) => `${user.display_name} ${user.email}`,
        }}
        filter={{
          label: 'Filter by role',
          options: [
            {
              value: 'organizers',
              label: 'Organizers',
              predicate: (user) => user.is_organizer,
            },
            {
              value: 'admins',
              label: 'Admins',
              predicate: (user) => user.is_admin,
            },
            {
              value: 'owners',
              label: 'Owners',
              predicate: (user) => user.is_owner,
            },
          ],
          selected: roleFilter,
          onChange: setRoleFilter,
        }}
        emptyMessage={({ hasRows }) =>
          hasRows ? 'No users match your search.' : 'No users found.'
        }
        renderCard={(user, { expanded, toggle }) => {
          const { isSaving, isSelf, canEditAdmin } = accessFlags(user);
          return (
            <ExpandableCard
              leading={
                <Avatar className="shrink-0">
                  <AvatarImage
                    src={user.photo_url}
                    alt={`${user.display_name}'s avatar`}
                  />
                  <AvatarFallback>
                    {user.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              }
              title={user.display_name}
              subtitle={user.email}
              badges={roleBadges(user)}
              trailing={
                user.is_discord_linked ? (
                  <FaDiscord
                    className="size-4 shrink-0 text-[#5865F2]"
                    aria-label={`${user.display_name} has Discord linked`}
                  />
                ) : null
              }
              expanded={expanded}
              onToggle={toggle}
            >
              <p className="text-muted-foreground text-xs">
                Joined {dayjs(user.created_at).format('MMM D, YYYY')}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Organizer</span>
                {organizerSwitch(user, isSaving)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Admin</span>
                {adminSwitch(user, isSaving, isSelf, canEditAdmin)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Owner</span>
                {ownerIndicator(user)}
              </div>
              <Link
                to={`/user/${user.username}`}
                className="text-primary text-sm hover:underline"
              >
                View profile
              </Link>
            </ExpandableCard>
          );
        }}
      />

      <Dialog
        open={pendingAdminChange != null}
        onOpenChange={(open) => {
          if (!open) closeAdminDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your password</DialogTitle>
            <DialogDescription>
              {pendingAdminChange != null
                ? `Enter your password to ${
                    pendingAdminChange.nextValue ? 'grant' : 'revoke'
                  } admin access for ${pendingAdminChange.user.display_name}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            autoFocus
            placeholder="Your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') confirmAdminChange();
            }}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={closeAdminDialog}>
              Cancel
            </Button>
            <Button
              onClick={confirmAdminChange}
              disabled={
                confirmPassword === '' ||
                savingUserId === pendingAdminChange?.user.id
              }
            >
              Confirm
              {savingUserId === pendingAdminChange?.user.id && <Spinner />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
