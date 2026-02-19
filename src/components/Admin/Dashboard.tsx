import React from 'react'
import type { Payload } from 'payload'
import { DollarSign, ShoppingCart, Clock, Package } from 'lucide-react'
import Link from 'next/link'
import { Order } from '@/payload-types'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT', // Assuming BDT as shown in checking checkout requirements "division, district" common in Bangladesh
  }).format(amount)
}

export const Dashboard = async ({ payload, user }: { payload: Payload; user: any }) => {
  // Fetch stats - get a subset for calculations
  // In a real production app with many orders, you'd want using aggregation endpoints or database adapter directly
  const { docs: orders, totalDocs } = await payload.find({
    collection: 'orders',
    limit: 100, // Limit for calculation sample
    depth: 0,
    sort: '-createdAt',
  })

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const pendingOrdersCount = orders.filter((order) => order.status === 'pending').length
  const recentOrders = orders.slice(0, 5)

  // Use lucide icons
  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      desc: 'Based on last 100 orders',
    },
    {
      label: 'Total Orders',
      value: totalDocs,
      icon: ShoppingCart,
      desc: 'Lifetime orders',
    },
    {
      label: 'Pending Orders',
      value: pendingOrdersCount,
      icon: Clock,
      desc: 'Requires attention',
    },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.email}</p>
      </div>

      <div className="dashboard__stats">
        {stats.map((stat, i) => (
          <div key={i} className="dashboard__stat-card">
            <div className="dashboard__stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="dashboard__stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <span>{stat.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard__recent">
        <div className="dashboard__recent-header">
          <h2>Recent Orders</h2>
          <Link href="/admin/collections/orders" className="dashboard__view-all">
            View All
          </Link>
        </div>
        <div className="dashboard__table-container">
          <table className="dashboard__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Status</th>
                <th>Date</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center">
                    No orders found
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/collections/orders/${order.id}`}
                        className="dashboard__link"
                      >
                        #{order.id.toString().substring(0, 8)}...
                      </Link>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{formatCurrency(order.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
