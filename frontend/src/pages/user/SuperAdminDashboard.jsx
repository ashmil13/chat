import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import UserService from '../../services/user-services/User-Service';

function SuperAdminDashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const { 
    getSuperAdminChats, 
    getSuperAdminUsers,
    updateUserRole,
    deleteUserAccount,
    getSuperAdminGroups,
    deleteGroupChat,
    deleteChatMessage
  } = UserService();

  const [activeTab, setActiveTab] = useState('overview');
  const [usersByCategory, setUsersByCategory] = useState({ SuperAdmin: [], Admin: [], User: [] });
  const [allChats, setAllChats] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [receiverFilter, setReceiverFilter] = useState('');
  const [messageSearch, setMessageSearch] = useState('');

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  useEffect(() => {
    if (auth.role !== 'SuperAdmin') {
      navigate('/user/dashboard', { state: { toastMessage: "Access denied: SuperAdmin role required", toastType: "error" } });
      return;
    }
    loadAllData();
  }, [auth]);

  const getUserColor = (userId) => {
    const colors = [
      '#e57373', // Red
      '#4db6ac', // Teal
      '#ffb74d', // Orange/Amber
      '#64b5f6', // Light Blue
      '#ba68c8', // Purple
      '#4dd0e1', // Cyan
      '#f06292', // Pink
      '#9575cd'  // Indigo
    ];
    if (!userId) return colors[0];
    const idStr = userId.toString();
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const [usersResponse, chatsResponse, groupsResponse] = await Promise.all([
        getSuperAdminUsers(),
        getSuperAdminChats(),
        getSuperAdminGroups()
      ]);

      if (usersResponse.data && usersResponse.data.success) {
        setUsersByCategory(usersResponse.data.groupedUsers || { SuperAdmin: [], Admin: [], User: [] });
        setTotalUsersCount(usersResponse.data.totalUsers || 0);
      }

      if (chatsResponse.data && chatsResponse.data.success) {
        setAllChats(chatsResponse.data.messages || []);
      }

      if (groupsResponse.data && groupsResponse.data.success) {
        setAllGroups(groupsResponse.data.groups || []);
      }
    } catch (err) {
      setError('Failed to fetch SuperAdmin dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.data && res.data.success) {
        triggerToast(`User role updated to ${newRole}!`, 'success');
        loadAllData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.error || 'Failed to update user role', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this user? All their messages and groups will be affected.')) {
      return;
    }
    try {
      const res = await deleteUserAccount(userId);
      if (res.data && res.data.success) {
        triggerToast('User and associated data deleted successfully!', 'success');
        loadAllData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? All group messages will be deleted.')) {
      return;
    }
    try {
      const res = await deleteGroupChat(groupId);
      if (res.data && res.data.success) {
        triggerToast('Group deleted successfully!', 'success');
        loadAllData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.error || 'Failed to delete group', 'error');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    try {
      const res = await deleteChatMessage(messageId);
      if (res.data && res.data.success) {
        triggerToast('Message deleted successfully!', 'success');
        loadAllData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.error || 'Failed to delete message', 'error');
    }
  };

  // Flattened users
  const flatUsers = [
    ...usersByCategory.SuperAdmin,
    ...usersByCategory.Admin,
    ...usersByCategory.User
  ];

  // Filters
  const filteredUsers = flatUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter ? u.role === userRoleFilter : true;
    return matchesSearch && matchesRole;
  });

  const filteredGroups = allGroups.filter(g => {
    return g.name.toLowerCase().includes(groupSearch.toLowerCase());
  });

  const filteredChats = allChats.filter(chat => {
    if (senderFilter && chat.sender?._id !== senderFilter) return false;
    if (receiverFilter && chat.receiver?._id !== receiverFilter) return false;
    if (messageSearch && !chat.text.toLowerCase().includes(messageSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="sa-workspace">
      {/* Embedded Premium CSS Style Tag */}
      <style>{`
        .sa-workspace {
          background: linear-gradient(135deg, #0e1621 0%, #152433 100%);
          min-height: 100vh;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #f5f6f7;
          display: flex;
          flex-direction: column;
        }

        .sa-container {
          display: flex;
          flex: 1;
          height: 100vh;
          overflow: hidden;
        }

        .sa-sidebar {
          width: 280px;
          background-color: #17212b;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          padding: 20px 0;
          flex-shrink: 0;
        }

        .sa-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 24px 24px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sa-brand-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #ff7e40, #ea580c);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
        }

        .sa-brand-title {
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.5px;
        }

        .sa-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 24px 16px;
          flex: 1;
        }

        .sa-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14.5px;
          color: #708190;
          transition: all 0.25s ease;
          border: none;
          background: transparent;
          text-align: left;
        }

        .sa-nav-item:hover, .sa-nav-item.active {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.04);
        }

        .sa-nav-item.active {
          background: linear-gradient(135deg, rgba(234, 88, 12, 0.15), rgba(234, 88, 12, 0.05));
          border-left: 3px solid #ea580c;
          padding-left: 13px;
        }

        .sa-nav-icon {
          font-size: 18px;
        }

        .sa-exit-btn {
          margin: 16px;
          padding: 12px 16px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .sa-exit-btn:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .sa-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: rgba(14, 22, 33, 0.2);
          overflow-y: auto;
          position: relative;
        }

        .sa-header {
          height: 80px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background-color: rgba(23, 33, 43, 0.5);
          backdrop-filter: blur(10px);
        }

        .sa-header-title {
          font-size: 20px;
          font-weight: 700;
        }

        .sa-refresh-btn {
          background: linear-gradient(135deg, #ff7e40, #ea580c);
          border: none;
          color: #ffffff;
          font-weight: 700;
          font-size: 13.5px;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
          transition: all 0.2s ease;
        }

        .sa-refresh-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(234, 88, 12, 0.35);
        }

        .sa-content {
          padding: 32px;
          max-width: 1300px;
          width: 100%;
          margin: 0 auto;
        }

        /* Stats Grid */
        .sa-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .sa-stat-card {
          background-color: #17212b;
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .sa-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #ff7e40, #ea580c);
        }

        .sa-stat-card.blue::before {
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        }

        .sa-stat-card.green::before {
          background: linear-gradient(90deg, #10b981, #047857);
        }

        .sa-stat-label {
          color: #708190;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .sa-stat-val {
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
        }

        /* Overview Accordion Details */
        .sa-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .sa-card {
          background-color: #17212b;
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .sa-card-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sa-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sa-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background-color: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }

        .sa-badge {
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .sa-badge.superadmin {
          background-color: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .sa-badge.admin {
          background-color: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .sa-badge.user {
          background-color: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        /* Filter Controls */
        .sa-filters {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .sa-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 200px;
          flex: 1;
        }

        .sa-label {
          font-size: 12px;
          font-weight: 700;
          color: #708190;
          text-transform: uppercase;
        }

        .sa-input, .sa-select {
          background-color: #17212b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }

        .sa-input:focus, .sa-select:focus {
          border-color: #ea580c;
          box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.2);
        }

        /* Audit Table */
        .sa-table-wrapper {
          background-color: #17212b;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.03);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .sa-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .sa-table th {
          background-color: rgba(255, 255, 255, 0.02);
          padding: 16px 20px;
          font-size: 12.5px;
          font-weight: 700;
          color: #708190;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sa-table td {
          padding: 16px 20px;
          font-size: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          vertical-align: middle;
        }

        .sa-table tr:last-child td {
          border-bottom: none;
        }

        .sa-table tr:hover td {
          background-color: rgba(255, 255, 255, 0.01);
        }

        .sa-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          color: #ffffff;
        }

        /* Buttons & Badges */
        .sa-btn-danger {
          background: linear-gradient(135deg, #f87171, #ef4444);
          border: none;
          color: #ffffff;
          font-weight: 700;
          font-size: 12px;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sa-btn-danger:hover {
          opacity: 0.9;
          transform: translateY(-0.5px);
        }

        .sa-user-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sa-user-meta {
          display: flex;
          flex-direction: column;
        }

        .sa-user-name {
          font-weight: 600;
          color: #ffffff;
        }

        .sa-user-email {
          font-size: 12px;
          color: #708190;
        }

        /* Toast overlay */
        .sa-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          background-color: #17212b;
          border: 1px solid #10b981;
          border-radius: 12px;
          padding: 14px 24px;
          box-shadow: 0 10px 35px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          animation: slideIn 0.3s ease forwards;
        }

        .sa-toast.error {
          border-color: #ef4444;
        }

        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Main Dashboard Layout Container */}
      <div className="sa-container">
        
        {/* Left Control Panel Sidebar */}
        <aside className="sa-sidebar">
          <div className="sa-brand">
            <div className="sa-brand-icon">S</div>
            <div className="sa-brand-title">SuperAdmin UI</div>
          </div>

          <nav className="sa-nav">
            <button 
              className={`sa-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="sa-nav-icon">📊</span> Overview
            </button>
            <button 
              className={`sa-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="sa-nav-icon">👥</span> Users Control
            </button>
            <button 
              className={`sa-nav-item ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
              <span className="sa-nav-icon">💬</span> Group Control
            </button>
            <button 
              className={`sa-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <span className="sa-nav-icon">🔍</span> Message Audit
            </button>
          </nav>

          <button onClick={() => navigate('/user/dashboard')} className="sa-exit-btn">
            &larr; Return to Chat Space
          </button>
        </aside>

        {/* Main Panel Content Area */}
        <main className="sa-main">
          <header className="sa-header">
            <h2 className="sa-header-title">
              {activeTab === 'overview' && 'System Analytics Overview'}
              {activeTab === 'users' && 'Users Control Center'}
              {activeTab === 'groups' && 'Active System Groups'}
              {activeTab === 'sa-audit' || activeTab === 'audit' && 'Audit Message Log transcripts'}
            </h2>
            <button onClick={loadAllData} className="sa-refresh-btn">
              Refresh System Logs
            </button>
          </header>

          <div className="sa-content">
            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', color: '#ef4444', fontWeight: '600' }}>
                {error}
              </div>
            )}

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
              <div>
                <div className="sa-stats-grid">
                  <div className="sa-stat-card">
                    <span className="sa-stat-label">Total Registered Users</span>
                    <span className="sa-stat-val">{totalUsersCount}</span>
                  </div>
                  <div className="sa-stat-card blue">
                    <span className="sa-stat-label">Active Group Chats</span>
                    <span className="sa-stat-val">{allGroups.length}</span>
                  </div>
                  <div className="sa-stat-card green">
                    <span className="sa-stat-label">Inspected Messages</span>
                    <span className="sa-stat-val">{allChats.length}</span>
                  </div>
                </div>

                <div className="sa-row-grid">
                  <div className="sa-card">
                    <h3 className="sa-card-title">User Roles Breakdown</h3>
                    <div className="sa-list">
                      <div className="sa-list-item">
                        <span style={{ fontWeight: '600' }}>Super Administrators</span>
                        <span className="sa-badge superadmin">{usersByCategory.SuperAdmin?.length || 0}</span>
                      </div>
                      <div className="sa-list-item">
                        <span style={{ fontWeight: '600' }}>Administrators</span>
                        <span className="sa-badge admin">{usersByCategory.Admin?.length || 0}</span>
                      </div>
                      <div className="sa-list-item">
                        <span style={{ fontWeight: '600' }}>Standard Chat Users</span>
                        <span className="sa-badge user">{usersByCategory.User?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sa-card">
                    <h3 className="sa-card-title">Quick Administration Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button onClick={() => setActiveTab('users')} className="sa-refresh-btn" style={{ width: '100%', padding: '14px', fontSize: '14px' }}>
                        👥 Manage Users & Roles
                      </button>
                      <button onClick={() => setActiveTab('groups')} className="sa-refresh-btn" style={{ width: '100%', padding: '14px', fontSize: '14px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
                        💬 Inspect & Delete Group Chats
                      </button>
                      <button onClick={() => setActiveTab('audit')} className="sa-refresh-btn" style={{ width: '100%', padding: '14px', fontSize: '14px', background: 'linear-gradient(135deg, #10b981, #047857)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                        🔍 Audit Message Transcripts
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: USERS CONTROL */}
            {activeTab === 'users' && (
              <div>
                <div className="sa-filters">
                  <div className="sa-input-group">
                    <label className="sa-label">Search Users</label>
                    <input 
                      type="text" 
                      className="sa-input" 
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <div className="sa-input-group">
                    <label className="sa-label">Filter Role</label>
                    <select 
                      className="sa-select"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                    >
                      <option value="">All Roles</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                      <option value="Admin">Admin</option>
                      <option value="User">User</option>
                    </select>
                  </div>
                </div>

                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>User Profile</th>
                        <th>Joined Date</th>
                        <th>System Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#708190' }}>
                            No users matched your filter query.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => {
                          const initials = u.name ? u.name.charAt(0).toUpperCase() : 'U';
                          const userColor = getUserColor(u._id);
                          const isCurrentUser = u._id === auth.id;

                          return (
                            <tr key={u._id}>
                              <td>
                                <div className="sa-user-info-cell">
                                  <div className="sa-avatar-circle" style={{ backgroundColor: userColor }}>
                                    {initials}
                                  </div>
                                  <div className="sa-user-meta">
                                    <span className="sa-user-name">{u.name} {isCurrentUser && '(You)'}</span>
                                    <span className="sa-user-email">{u.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td>
                                <select 
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                  disabled={isCurrentUser}
                                  className="sa-select"
                                  style={{ padding: '6px 12px', fontSize: '13px' }}
                                >
                                  <option value="SuperAdmin">SuperAdmin</option>
                                  <option value="Admin">Admin</option>
                                  <option value="User">User</option>
                                </select>
                              </td>
                              <td>
                                <button 
                                  onClick={() => handleDeleteUser(u._id)}
                                  disabled={isCurrentUser}
                                  className="sa-btn-danger"
                                  style={{ opacity: isCurrentUser ? 0.3 : 1, cursor: isCurrentUser ? 'not-allowed' : 'pointer' }}
                                >
                                  Delete User
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: GROUP CONTROL */}
            {activeTab === 'groups' && (
              <div>
                <div className="sa-filters">
                  <div className="sa-input-group" style={{ maxWidth: '400px' }}>
                    <label className="sa-label">Search Groups</label>
                    <input 
                      type="text" 
                      className="sa-input" 
                      placeholder="Search group name..."
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Group Name</th>
                        <th>Created By</th>
                        <th>Members Count</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGroups.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#708190' }}>
                            No active group chats found.
                          </td>
                        </tr>
                      ) : (
                        filteredGroups.map(g => {
                          const initials = g.name ? g.name.charAt(0).toUpperCase() : 'G';
                          const groupColor = getUserColor(g._id);
                          return (
                            <tr key={g._id}>
                              <td>
                                <div className="sa-user-info-cell">
                                  <div className="sa-avatar-circle" style={{ backgroundColor: groupColor }}>
                                    {initials}
                                  </div>
                                  <span className="sa-user-name">{g.name}</span>
                                </div>
                              </td>
                              <td>
                                <span className="sa-user-name">{g.creator?.name || 'Unknown Creator'}</span>
                              </td>
                              <td className="bold">{g.members?.length || 0} members</td>
                              <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                              <td>
                                <button 
                                  onClick={() => handleDeleteGroup(g._id)}
                                  className="sa-btn-danger"
                                >
                                  Delete Group
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MESSAGE AUDIT */}
            {activeTab === 'audit' && (
              <div>
                <div className="sa-filters">
                  <div className="sa-input-group">
                    <label className="sa-label">Sender filter</label>
                    <select 
                      value={senderFilter} 
                      onChange={(e) => setSenderFilter(e.target.value)}
                      className="sa-select"
                    >
                      <option value="">All Senders</option>
                      {flatUsers.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="sa-input-group">
                    <label className="sa-label">Receiver filter</label>
                    <select 
                      value={receiverFilter} 
                      onChange={(e) => setReceiverFilter(e.target.value)}
                      className="sa-select"
                    >
                      <option value="">All Receivers</option>
                      {flatUsers.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="sa-input-group">
                    <label className="sa-label">Search Message Text</label>
                    <input 
                      type="text" 
                      className="sa-input" 
                      placeholder="Keyword match..."
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Sender</th>
                        <th>Target type</th>
                        <th>Recipient / Group</th>
                        <th>Message Content</th>
                        <th>Timestamp</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChats.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#708190' }}>
                            No message logs found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredChats.map(chat => {
                          const isGroup = !!chat.group;
                          return (
                            <tr key={chat._id}>
                              <td className="bold">{chat.sender?.name || 'Deleted User'}</td>
                              <td>
                                <span className="sa-badge" style={{ backgroundColor: isGroup ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: isGroup ? '#10b981' : '#3b82f6' }}>
                                  {isGroup ? 'Group' : 'DM'}
                                </span>
                              </td>
                              <td className="bold">
                                {isGroup ? (chat.group?.name || 'Group Chat') : (chat.receiver?.name || 'Deleted User')}
                              </td>
                              <td style={{ maxWidth: '300px', wordBreak: 'break-all' }}>{chat.text}</td>
                              <td>{new Date(chat.createdAt).toLocaleString()}</td>
                              <td>
                                <button 
                                  onClick={() => handleDeleteMessage(chat._id)}
                                  className="sa-btn-danger"
                                  style={{ padding: '6px 10px', fontSize: '11.5px' }}
                                >
                                  Delete Msg
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Global Action Toasts */}
      {toast.show && (
        <div className={`sa-toast ${toast.type === 'error' ? 'error' : ''}`}>
          <span>{toast.type === 'success' ? '✓' : '✗'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;
