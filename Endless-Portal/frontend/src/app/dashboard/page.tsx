'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { useOrders, useInventory, useFollowups } from '@/services/queries';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getHomePathForRole, normalizeRole } from '@/lib/roles';

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = normalizeRole(user?.role);

  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: inventory, isLoading: invLoading } = useInventory();
  const { data: followups, isLoading: folLoading } = useFollowups();

  useEffect(() => {
    if (role === 'marketing') {
      router.replace(getHomePathForRole(role));
    }
  }, [role, router]);

  if (role === 'marketing') {
    return null;
  }

  const isLoading = ordersLoading || invLoading || folLoading;

  const pendingOrders = orders?.filter((o: any) => o.status === 'Pending').length || 0;
  const completedOrders = orders?.filter((o: any) => o.status === 'Completed').length || 0;
  const lowStockItems = inventory?.filter((i: any) => i.quantity <= i.reorder_level).length || 0;

  const stats = [
    {
      title: 'Total Orders',
      value: orders?.length || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Pending Orders',
      value: pendingOrders,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Completed Orders',
      value: completedOrders,
      icon: CheckCircle2,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Total Materials',
      value: inventory?.length || 0,
      icon: Package,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockItems,
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Total Follow-ups',
      value: followups?.length || 0,
      icon: Users,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400'
    }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Overview of your memorials business
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="flex items-center p-6">
                  <div className={`mr-4 flex h-14 w-14 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <Icon className={`h-7 w-7 ${stat.textColor}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</h3>
                    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? '...' : stat.value}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Recent Orders</h2>
          <Card hoverEffect={false} className="p-0 overflow-hidden border-slate-200/60 dark:border-slate-800">
            {isLoading ? (
              <div className="animate-pulse space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-200/50 dark:bg-slate-700/50"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Design</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-transparent">
                    {orders?.slice(0, 5).map((order: any, i: number) => (
                      <motion.tr 
                        key={order.order_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{order.client_name}</td>
                        <td className="px-6 py-4">{order.design_type}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                      </motion.tr>
                    ))}
                    {(!orders || orders.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          No orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
