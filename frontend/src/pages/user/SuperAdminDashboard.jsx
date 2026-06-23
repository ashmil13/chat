import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import UserService from '../../services/user-services/User-Service';
import '../../css/userstyle/dashboard.css'; // sharing base styling with dashboard

function SuperAdminDashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const { getSuperAdminChats, getSuperAdminUsers } = UserService();

  const [usersByCategory, setUsersByCategory] = useState({ SuperAdmin: [], Admin: [], User: [] });
  const [allChats, setAllChats] = useState([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inspector States
  const [senderFilter, setSenderFilter] = useState('');
  const [receiverFilter, setReceiverFilter] = useState('');

  useEffect(() => {
    // Redirect if not SuperAdmin
    if (auth.role !== 'SuperAdmin') {
      navigate('/user/dashboard', { state: { toastMessage: "Access denied: SuperAdmin role required", toastType: "error" } });
      return;
    }

    loadDashboardData();
  }, [auth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersResponse, chatsResponse] = await Promise.all([
        getSuperAdminUsers(),
        getSuperAdminChats()
      ]);

      if (usersResponse.data && usersResponse.data.success) {
        setUsersByCategory(usersResponse.data.groupedUsers || { SuperAdmin: [], Admin: [], User: [] });
        setTotalUsersCount(usersResponse.data.totalUsers || 0);
      }

      if (chatsResponse.data && chatsResponse.data.success) {
        setAllChats(chatsResponse.data.messages || []);
      }
    } catch (err) {
      setError('Failed to load SuperAdmin dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter messages based on inspector selections
  const filteredChats = allChats.filter(chat => {
    if (senderFilter && chat.sender?._id !== senderFilter) return false;
    if (receiverFilter && chat.receiver?._id !== receiverFilter) return false;
    return true;
  });

  // Flattened users list for select dropdowns
  const flatUsers = [
    ...usersByCategory.SuperAdmin,
    ...usersByCategory.Admin,
    ...usersByCategory.User
  ];

  return (
    <div className="aura-workspace">
      <div className="aura-chat-container superadmin-container-layout">
        
        {/* Left Control & User Categories Panel */}
        <aside className="aura-sidebar superadmin-sidebar">
          
          <div className="sidebar-header">
            <div className="brand-logo">
              <span className="logo-icon admin">S</span>
              <span className="logo-text">SuperAdmin</span>
            </div>
          </div>

          <div className="stats-row-compact">
            <div className="stat-card">
              <span className="stat-label">TOTAL USERS</span>
              <span className="stat-number">{totalUsersCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">TOTAL CHATS</span>
              <span className="stat-number">{allChats.length}</span>
            </div>
          </div>

          {/* User Categories lists */}
          <div className="categories-accordion">
            
            {/* Super Admins */}
            <div className="category-section">
              <h4 className="category-title">SuperAdmins ({usersByCategory.SuperAdmin.length})</h4>
              <ul className="category-user-list">
                {usersByCategory.SuperAdmin.map(u => (
                  <li key={u._id} className="category-user-item">
                    <span className="user-dot superadmin"></span>
                    <div className="user-details">
                      <span className="u-name">{u.name}</span>
                      <span className="u-email">{u.email}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Admins */}
            <div className="category-section">
              <h4 className="category-title">Admins ({usersByCategory.Admin.length})</h4>
              <ul className="category-user-list">
                {usersByCategory.Admin.length === 0 ? <p className="no-users-lbl">No Admin users registered</p> : (
                  usersByCategory.Admin.map(u => (
                    <li key={u._id} className="category-user-item">
                      <span className="user-dot admin"></span>
                      <div className="user-details">
                        <span className="u-name">{u.name}</span>
                        <span className="u-email">{u.email}</span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Regular Users */}
            <div className="category-section">
              <h4 className="category-title">Users ({usersByCategory.User.length})</h4>
              <ul className="category-user-list scrollable-category-list">
                {usersByCategory.User.length === 0 ? <p className="no-users-lbl">No standard users registered</p> : (
                  usersByCategory.User.map(u => (
                    <li key={u._id} className="category-user-item">
                      <span className="user-dot user"></span>
                      <div className="user-details">
                        <span className="u-name">{u.name}</span>
                        <span className="u-email">{u.email}</span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

          </div>

          {/* Back to Chat Workspace */}
          <button 
            onClick={() => navigate('/user/dashboard')} 
            className="back-to-chat-btn"
          >
            &larr; Back to Chat Space
          </button>

        </aside>

        {/* Main Chats Transcript Inspector Panel */}
        <main className="aura-chat-panel superadmin-main-panel">
          
          <header className="chat-header">
            <div className="header-info">
              <h2 className="chat-title">Chat Log Transcripts</h2>
              <span className="chat-participants">Audit all chat activities in the application</span>
            </div>
            <button onClick={loadDashboardData} className="refresh-btn" title="Refresh Logs">
              Refresh
            </button>
          </header>

          {/* Transcript Filter Bar */}
          <div className="audit-filter-bar">
            <div className="filter-group">
              <label>Participant 1</label>
              <select 
                value={senderFilter} 
                onChange={(e) => setSenderFilter(e.target.value)}
                className="audit-select"
              >
                <option value="">All Users</option>
                {flatUsers.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Participant 2</label>
              <select 
                value={receiverFilter} 
                onChange={(e) => setReceiverFilter(e.target.value)}
                className="audit-select"
              >
                <option value="">All Users</option>
                {flatUsers.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            {(senderFilter || receiverFilter) && (
              <button 
                onClick={() => { setSenderFilter(''); setReceiverFilter(''); }}
                className="clear-filters-btn"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Chat Transcripts Output list */}
          <div className="transcripts-log-container">
            {loading ? (
              <div className="audit-empty">
                <h3>Loading chats audit logs...</h3>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="audit-empty">
                <h3>No chat transcripts found</h3>
                <p>Try clearing filters or check back after users start sending messages.</p>
              </div>
            ) : (
              <div className="audit-table-wrapper">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Sender</th>
                      <th>Category</th>
                      <th>Recipient</th>
                      <th>Category</th>
                      <th>Message</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChats.map(chat => (
                      <tr key={chat._id}>
                        <td className="bold">{chat.sender?.name || 'Deleted User'}</td>
                        <td>
                          <span className={`badge-role-tag ${chat.sender?.role}`}>
                            {chat.sender?.role || 'N/A'}
                          </span>
                        </td>
                        <td className="bold">{chat.receiver?.name || 'Deleted User'}</td>
                        <td>
                          <span className={`badge-role-tag ${chat.receiver?.role}`}>
                            {chat.receiver?.role || 'N/A'}
                          </span>
                        </td>
                        <td className="msg-cell">{chat.text}</td>
                        <td className="time-cell">{new Date(chat.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>

      </div>
    </div>
  );
}

export default SuperAdminDashboard;
