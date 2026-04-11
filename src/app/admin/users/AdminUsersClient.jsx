'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mail,
  MoreVertical,
  Phone,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
  Users as UsersIcon,
  X,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

import AppPagination from '@/components/AppPagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

function buildHref(pathname, searchParams, updates) {
  const params = new URLSearchParams(searchParams?.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function AdminUsersClient({
  initialUsers,
  total,
  totalPages,
  currentPage,
  initialSearchQuery,
  initialStatusFilter,
  initialTypeFilter,
  summary,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter);
  const [loadingId, setLoadingId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const isCustomersView = typeFilter === 'customers';

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    setTypeFilter(initialTypeFilter);
  }, [initialTypeFilter]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return undefined;

    setHighlightedId(id);

    const scrollTimer = setTimeout(() => {
      const element = document.getElementById(`user-${id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    const clearTimer = setTimeout(() => {
      setHighlightedId(null);
    }, 3000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [searchParams]);

  function navigate(updates) {
    const href = buildHref(pathname, searchParams, updates);
    startTransition(() => {
      router.push(href);
    });
  }

  function clearFilters() {
    setSearchQuery('');
    if (!isCustomersView) {
      setStatusFilter('all');
    }
    navigate({ search: null, status: isCustomersView ? null : null, page: null });
  }

  async function handleUserAction(user, updateData) {
    setLoadingId(user._id);

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || 'Action failed');
        return;
      }

      if (typeof updateData.disabled === 'boolean') {
        setUsers((prev) => prev.map((entry) => (
          entry._id === user._id ? { ...entry, disabled: updateData.disabled } : entry
        )));
        toast.success(`User ${updateData.disabled ? 'disabled' : 'enabled'} successfully`);
      } else if (updateData.action === 'force-logout') {
        toast.success('User logged out from all devices');
      }

      router.refresh();
    } catch (error) {
      toast.error('An error occurred during user action');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">User Management</h1>
          <p className="text-muted-foreground">
            {isCustomersView ? 'Verified buyers captured from placed orders.' : 'View and manage registered users for your store.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={isCustomersView ? 'outline' : 'default'}
          onClick={() => {
            setTypeFilter('registered');
            navigate({ type: null, status: statusFilter === 'all' ? null : statusFilter, page: null });
          }}
        >
          Registered Users
        </Button>
        <Button
          type="button"
          variant={isCustomersView ? 'default' : 'outline'}
          onClick={() => {
            setTypeFilter('customers');
            setStatusFilter('all');
            navigate({ type: 'customers', status: null, page: null });
          }}
        >
          Customers
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="admin-surface border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">{isCustomersView ? 'Verified Buyers' : 'Total Users'}</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{summary.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UsersIcon className="size-3" />
              <span>{isCustomersView ? 'Unique customers with orders' : 'All registered accounts'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-surface border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">{isCustomersView ? 'Profiles With Email' : 'Active Users'}</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{isCustomersView ? summary.withEmail : summary.activeUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserCheck className="size-3" />
              <span>{isCustomersView ? 'Customers with email captured' : 'Allowed to login'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-none bg-destructive/6">
          <CardHeader className="pb-2">
            <CardDescription className="text-destructive/70">{isCustomersView ? 'Profiles With Address' : 'Disabled Users'}</CardDescription>
            <CardTitle className="text-3xl font-bold text-destructive">{isCustomersView ? summary.withAddress : summary.disabledUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-destructive/60">
              {isCustomersView ? <MapPin className="size-3" /> : <UserX className="size-3" />}
              <span>{isCustomersView ? 'Customers with saved delivery address' : 'Blocked from login'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ search: searchQuery.trim() || null, page: null });
          }}
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
        <div className="flex items-center gap-2">
          {!isCustomersView ? (
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                navigate({ status: value, page: null });
              }}
            >
              <SelectTrigger className="h-10 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="disabled">Disabled Only</SelectItem>
              </SelectContent>
            </Select>
          ) : null}

          {(searchQuery || (!isCustomersView && statusFilter !== 'all')) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 px-3 gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className={cn('rounded-xl border border-border bg-card shadow-sm transition-opacity', isPending && 'opacity-70')}>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{isCustomersView ? 'Profile' : 'Joining Date'}</TableHead>
              <TableHead>{isCustomersView ? 'Orders' : 'Status'}</TableHead>
              <TableHead className="text-right">{isCustomersView ? 'Last Order' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow
                  key={user._id}
                  id={`user-${user._id}`}
                  className={cn(
                    'transition-all duration-700',
                    highlightedId === user._id ? 'bg-muted ring-1 ring-border' : 'hover:bg-muted/30',
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border border-border">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          {user.name}
                          {highlightedId === user._id && (
                            <Badge className="h-4 animate-pulse bg-foreground px-1 text-[10px] uppercase tracking-wider text-background">
                              New
                            </Badge>
                          )}
                        </span>
                        {user.phone && <span className="text-xs text-muted-foreground">{user.phone}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-3" />
                      {user.email || 'Not provided'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isCustomersView ? (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="size-3" />
                          <span>{user.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3" />
                          <span className="line-clamp-2">{[user.address, user.city].filter(Boolean).join(', ') || 'Not provided'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-3" />
                        <span suppressHydrationWarning>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isCustomersView ? (
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-foreground">{user.ordersCount} order{user.ordersCount === 1 ? '' : 's'}</p>
                        <p className="text-muted-foreground">Rs. {Number(user.totalSpent || 0).toLocaleString('en-PK')}</p>
                      </div>
                    ) : (
                      user.disabled ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1 font-bold">
                          <UserX className="size-3" />
                          Disabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex w-fit items-center gap-1 bg-muted font-bold text-foreground">
                          <UserCheck className="size-3" />
                          Active
                        </Badge>
                      )
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isCustomersView ? (
                      <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={user.disabled ? 'text-foreground focus:text-foreground' : 'text-destructive focus:text-destructive'}
                              onClick={() => handleUserAction(user, { disabled: !user.disabled })}
                              disabled={loadingId === user._id}
                            >
                              {user.disabled ? (
                                <><UserCheck className="mr-2 size-4" /> Enable User</>
                              ) : (
                                <><UserX className="mr-2 size-4" /> Disable User</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user, { action: 'force-logout' })}
                              disabled={loadingId === user._id || user.disabled}
                            >
                              <LogOut className="mr-2 size-4" /> Force Logout
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-muted p-3 text-muted-foreground">
                      <Search className="size-6" />
                    </div>
                    <p className="font-medium">No users found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search terms.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 px-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{((currentPage - 1) * 12) + 1}</span> to{' '}
            <span className="font-medium text-foreground">{Math.min(currentPage * 12, total)}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span> {isCustomersView ? 'customers' : 'users'}
          </p>
          <AppPagination
            page={currentPage}
            totalPages={totalPages}
            getHref={(page) => buildHref(pathname, searchParams, { page })}
          />
        </div>
      )}

      {!isCustomersView ? (
        <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/40 p-4">
          <div className="shrink-0 rounded-lg bg-muted p-2 text-foreground">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Security Note</h4>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Disabling a user will prevent them from signing in to their account. If the user is currently logged in, they will be blocked upon their next authentication request. This action is manually reversible at any time by an administrator.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
