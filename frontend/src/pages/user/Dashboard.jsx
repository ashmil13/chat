import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import UserService from '../../services/user-services/User-Service';
import '../../css/userstyle/dashboard.css';

function Dashboard() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    getConnections,
    getUsersList,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    sendMessage,
    getChatHistory,
    updateProfile,
    createGroup,
    getGroups,
    updateGroupName,
    makeGroupAdmin
  } = UserService();


  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectionSource, setSelectionSource] = useState(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editProfileMode, setEditProfileMode] = useState(false);


  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (location.state?.toastMessage) {
      showToast(location.state.toastMessage, location.state.toastType || 'info');

      window.history.replaceState({}, document.title);
    }
  }, [location]);


  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);


  const [newName, setNewName] = useState(auth.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');


  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');


  const [sidebarSearch, setSidebarSearch] = useState('');


  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [editGroupNameInput, setEditGroupNameInput] = useState('');
  const [groupInfoError, setGroupInfoError] = useState('');
  const [groupInfoSuccess, setGroupInfoSuccess] = useState('');

  const messagesEndRef = useRef(null);


  useEffect(() => {
    fetchFriends();
    fetchSystemUsers();
    fetchGroups();

    const dataInterval = setInterval(() => {
      fetchFriends();
      fetchSystemUsers();
      fetchGroups();
    }, 5000);

    return () => clearInterval(dataInterval);
  }, []);


  useEffect(() => {
    let interval;
    if (selectedFriend) {
      if (selectedFriend.isGroup) {
        fetchGroupChatHistory();
        interval = setInterval(fetchGroupChatHistory, 3000);
      } else if (selectedFriend.connectionStatus === 'accepted') {
        fetchChatHistory();
        interval = setInterval(fetchChatHistory, 3000);
      } else {
        setChatMessages([]);
      }
    } else {
      setChatMessages([]);
    }
    return () => clearInterval(interval);
  }, [selectedFriend]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getUserColor = (userId) => {
    const colors = [
      '#e57373',
      '#4db6ac',
      '#ffb74d',
      '#64b5f6',
      '#ba68c8',
      '#4dd0e1',
      '#f06292',
      '#9575cd'
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

  const fetchFriends = async () => {
    try {
      const response = await getConnections();
      if (response.data && response.data.success) {
        let list = response.data.connections || [];
        if (selectedFriend) {
          list = list.map(f =>
            f._id === selectedFriend._id ? { ...f, unreadCount: 0 } : f
          );
        }
        setFriends(list);
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const response = await getUsersList();
      if (response.data && response.data.success) {
        setAllUsers(response.data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch system users:', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await getGroups();
      if (response.data && response.data.success) {
        setGroups(response.data.groups || []);


        if (selectedFriend && selectedFriend.isGroup) {
          const activeGroup = response.data.groups.find(g => g._id === selectedFriend._id);
          if (activeGroup) {
            setSelectedFriend(activeGroup);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const fetchChatHistory = async () => {
    if (!selectedFriend) return;
    try {
      const response = await getChatHistory(selectedFriend._id);
      if (response.data && response.data.success) {
        setChatMessages(response.data.messages || []);
        setFriends(prevFriends =>
          prevFriends.map(f =>
            f._id === selectedFriend._id ? { ...f, unreadCount: 0 } : f
          )
        );
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const fetchGroupChatHistory = async () => {
    if (!selectedFriend || !selectedFriend.isGroup) return;
    try {
      const response = await getChatHistory(selectedFriend._id, true);
      if (response.data && response.data.success) {
        setChatMessages(response.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load group chat history:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!selectedFriend) return;

    try {
      const response = await sendMessage(selectedFriend._id, inputText.trim(), selectedFriend.isGroup);
      if (response.data && response.data.success) {
        setInputText('');
        if (selectedFriend.isGroup) {
          fetchGroupChatHistory();
        } else {
          fetchChatHistory();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send message', 'error');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showToast('Please enter a group name', 'error');
      return;
    }
    try {
      const response = await createGroup({
        name: newGroupName.trim(),
        members: selectedGroupMembers
      });
      if (response.data && response.data.success) {
        showToast('Group created successfully!', 'success');
        setNewGroupName('');
        setSelectedGroupMembers([]);
        setShowCreateGroupModal(false);
        fetchGroups();

        const created = response.data.group;
        const groupTarget = {
          _id: created._id,
          name: created.name,
          creator: created.creator,
          admins: created.admins,
          members: created.members,
          isGroup: true
        };
        setSelectedFriend(groupTarget);
        setSelectionSource('dm');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create group', 'error');
    }
  };

  const handleUpdateGroupName = async (e) => {
    e.preventDefault();
    if (!editGroupNameInput.trim()) {
      setGroupInfoError('Group name cannot be empty');
      return;
    }
    setGroupInfoError('');
    setGroupInfoSuccess('');
    try {
      const response = await updateGroupName(selectedFriend._id, editGroupNameInput.trim());
      if (response.data && response.data.success) {
        setGroupInfoSuccess('Group name updated successfully!');
        showToast('Group name updated!', 'success');

        const updated = response.data.group;
        const updatedGroup = {
          ...selectedFriend,
          name: updated.name,
          admins: updated.admins,
          members: updated.members
        };
        setSelectedFriend(updatedGroup);
        fetchGroups();
      }
    } catch (err) {
      setGroupInfoError(err.response?.data?.error || 'Failed to update group name');
    }
  };

  const handleMakeGroupAdmin = async (userId) => {
    setGroupInfoError('');
    setGroupInfoSuccess('');
    try {
      const response = await makeGroupAdmin(selectedFriend._id, userId);
      if (response.data && response.data.success) {
        setGroupInfoSuccess('User promoted to Group Admin successfully!');
        showToast('User promoted to Admin!', 'success');

        const updated = response.data.group;
        const updatedGroup = {
          ...selectedFriend,
          admins: updated.admins,
          members: updated.members
        };
        setSelectedFriend(updatedGroup);
        fetchGroups();
      }
    } catch (err) {
      setGroupInfoError(err.response?.data?.error || 'Failed to promote user');
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      const response = await sendConnectionRequest(userId);
      if (response.data && response.data.success) {
        fetchSystemUsers();
        fetchFriends();
        const conn = response.data.connection;
        const finalStatus = (conn && conn.status === 'accepted') ? 'accepted' : 'pending_sent';
        setSelectedFriend(prev => prev && prev._id === userId ? { ...prev, connectionStatus: finalStatus } : prev);
        setSelectionSource('dm');
        showToast(finalStatus === 'accepted' ? 'Connected successfully!' : 'Connection request sent!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send request', 'error');
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      const response = await acceptConnectionRequest(userId);
      if (response.data && response.data.success) {
        fetchSystemUsers();
        fetchFriends();
        setSelectedFriend(prev => prev && prev._id === userId ? { ...prev, connectionStatus: 'accepted' } : prev);
        setSelectionSource('dm');
        showToast('Connection request accepted!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      const response = await rejectConnectionRequest(userId);
      if (response.data && response.data.success) {
        fetchSystemUsers();
        fetchFriends();
        setSelectedFriend(prev => prev && prev._id === userId ? null : prev);
        setSelectionSource(null);
        showToast('Connection request removed.', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove connection', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("profileImage");
    setAuth({});
    navigate("/login");
  };

  useEffect(() => {
    if (auth.name) {
      setNewName(auth.name);
    }
  }, [auth]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setSettingsError('New passwords do not match');
      return;
    }

    try {
      const payload = {};
      if (newName !== auth.name) {
        payload.name = newName;
      }
      if (currentPassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      if (Object.keys(payload).length === 0) {
        setSettingsError('No changes specified');
        return;
      }

      const response = await updateProfile(payload);
      if (response.data && response.data.success) {
        setSettingsSuccess('Profile updated successfully');
        showToast('Profile updated successfully!', 'success');

        const updatedUser = response.data.data;
        const newAuth = { ...auth, name: updatedUser.name };
        setAuth(newAuth);
        localStorage.setItem('name', updatedUser.name);

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setSettingsError(err.response?.data?.error || 'Failed to update profile');
      showToast(err.response?.data?.error || 'Failed to update profile', 'error');
    }
  };

  const sortedFriends = friends
    .filter(friend => friend._id.toString() !== auth.id?.toString())
    .filter(friend => friend.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
    .sort((a, b) => {

      const aHasUnread = (a.unreadCount || 0) > 0;
      const bHasUnread = (b.unreadCount || 0) > 0;
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;


      if (a.lastMessageAt && b.lastMessageAt) {
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      }
      if (a.lastMessageAt && !b.lastMessageAt) return -1;
      if (!a.lastMessageAt && b.lastMessageAt) return 1;


      return a.name.localeCompare(b.name);
    });

  const incomingRequests = friends.filter(friend => friend.connectionStatus === 'pending_received');
  const sentRequests = friends.filter(friend => friend.connectionStatus === 'pending_sent');

  const filteredGroups = groups
    .filter(group => group.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
    .sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) {
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      }
      if (a.lastMessageAt && !b.lastMessageAt) return -1;
      if (!a.lastMessageAt && b.lastMessageAt) return 1;
      return a.name.localeCompare(b.name);
    });

  const exploreUsersList = allUsers.filter(user => {
    if (user.role === 'SuperAdmin') return false;
    if (user._id.toString() === auth.id?.toString()) return false;
    if (user.connectionStatus && user.connectionStatus !== 'none') return false;
    return user.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
           user.email.toLowerCase().includes(sidebarSearch.toLowerCase());
  });

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (lastLoginIso) => {
    if (!lastLoginIso) return 'offline';
    const lastSeenDate = new Date(lastLoginIso);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) {
      return 'Online';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${lastSeenDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <div className={`telegram-workspace ${darkMode ? '' : 'light-theme'} ${selectedFriend ? 'chat-active' : ''} ${showSettingsModal ? 'profile-active' : ''}`}>
      <div className="telegram-container">


        <aside className="telegram-sidebar">


          <div className="tg-sidebar-header">
            <button
              className="tg-menu-btn"
              title="Settings"
              onClick={() => {
                setSettingsError('');
                setSettingsSuccess('');
                setShowSettingsModal(true);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h1 className="tg-brand-name">chating</h1>


            <button
              className="tg-theme-toggle-header-btn"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.93 4.93l1.59 1.59m10.96 10.96l1.59 1.59M3 12h2.25m13.5 0H21M4.93 19.07l1.59-1.59m10.96-10.96l1.59-1.59M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>


            <button
              className="tg-requests-btn"
              title="Connection Requests"
              onClick={() => setShowRequestsModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              {incomingRequests.length > 0 && (
                <span className="tg-badge-counter">{incomingRequests.length}</span>
              )}
            </button>

            {auth.role === 'SuperAdmin' && (
              <button className="tg-admin-btn" title="SuperAdmin Dashboard" onClick={() => navigate('/superadmin')}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </button>
            )}
          </div>


          <div className="tg-search-bar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="tg-search-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
            <input
              type="text"
              placeholder="Search contacts..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
            />
          </div>


          <div className="tg-stories-row">
            <div className="tg-story-item self">
              <div className="tg-story-avatar add">
                <span>+</span>
              </div>
              <span className="tg-story-name">Your Story</span>
            </div>
            {friends.filter(f => f.connectionStatus === 'accepted').slice(0, 5).map((friend, idx) => {
              const initials = friend.name ? friend.name.charAt(0).toUpperCase() : 'U';
              return (
                <div key={friend._id} className="tg-story-item" onClick={() => { setSelectedFriend(friend); setSelectionSource('dm'); }}>
                  <div className="tg-story-avatar">
                    {friend.profileImage ? <img src={friend.profileImage} alt={friend.name} /> : <div className="tg-story-avatar-placeholder">{initials}</div>}
                    <span className="tg-story-status-dot online"></span>
                  </div>
                  <span className="tg-story-name">{friend.name.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>


          <div className="tg-sidebar-content">


            <div className="tg-section">
              <div className="tg-section-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '12px', marginBottom: '8px' }}>
                <span className="tg-section-header" style={{ margin: 0 }}>Groups</span>
                <button
                  className="tg-create-group-btn"
                  onClick={() => {
                    setNewGroupName('');
                    setSelectedGroupMembers([]);
                    setShowCreateGroupModal(true);
                  }}
                  title="Create Group"
                  style={{ background: 'none', border: 'none', color: '#ea580c', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0 4px' }}
                >
                  + Create
                </button>
              </div>
              <ul className="tg-list">
                {filteredGroups.length === 0 ? (
                  <p className="tg-no-items">No groups joined yet.</p>
                ) : (
                  filteredGroups.map((group) => {
                    const isSelected = selectedFriend?._id === group._id && selectedFriend?.isGroup;
                    const initials = group.name ? group.name.charAt(0).toUpperCase() : 'G';
                    return (
                      <li
                        key={group._id}
                        className={`tg-list-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedFriend(group);
                          setSelectionSource('dm');
                          setChatMessages([]);
                        }}
                      >
                        <div className="tg-avatar-wrapper">
                          <div className="tg-item-avatar placeholder" style={{ backgroundColor: '#ea580c', color: '#fff' }}>{initials}</div>
                        </div>
                        <div className="tg-item-body">
                          <div className="tg-item-row">
                            <span className="tg-item-title">{group.name}</span>
                            <span className="tg-item-time">
                              {group.lastMessageAt ? formatTime(group.lastMessageAt) : ''}
                            </span>
                          </div>
                          <div className="tg-item-row">
                            <span className="tg-item-snippet">
                              {group.lastMessageText
                                ? `${group.lastMessageSender?.name || 'User'}: ${group.lastMessageText}`
                                : 'No messages yet'}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>


            <div className="tg-section">
              <span className="tg-section-header">Direct Messages</span>
              <ul className="tg-list">
                {sortedFriends.length === 0 ? (
                  <p className="tg-no-items">No friends connected matching search.</p>
                ) : (
                  sortedFriends.map((friend, idx) => {
                    const isSelected = selectedFriend?._id === friend._id && selectionSource === 'dm';
                    const initials = friend.name ? friend.name.charAt(0).toUpperCase() : 'U';
                    const isAccepted = friend.connectionStatus === 'accepted';

                    return (
                      <li
                        key={friend._id}
                        className={`tg-list-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedFriend(friend);
                          setSelectionSource('dm');
                          setFriends(prevFriends =>
                            prevFriends.map(f =>
                              f._id === friend._id ? { ...f, unreadCount: 0 } : f
                            )
                          );
                        }}
                      >
                        <div className="tg-avatar-wrapper">
                          {friend.profileImage ? (
                            <img src={friend.profileImage} alt={friend.name} className="tg-item-avatar" />
                          ) : (
                            <div className="tg-item-avatar placeholder">{initials}</div>
                          )}
                          {isAccepted && (
                            <span className={`tg-online-badge ${idx % 3 === 0 ? 'online' : ''}`}></span>
                          )}
                        </div>
                        <div className="tg-item-body">
                          <div className="tg-item-row">
                            <span className="tg-item-title">{friend.name}</span>
                            <span className="tg-item-time">
                              {isAccepted
                                ? (friend.lastMessageAt ? formatTime(friend.lastMessageAt) : 'online')
                                : 'pending'}
                            </span>
                          </div>
                          <div className="tg-item-row">
                            <span className="tg-item-snippet">
                              {isAccepted
                                ? (friend.lastMessageText
                                    ? `${friend.lastMessageSender?.toString() === auth.id?.toString() ? 'You: ' : ''}${friend.lastMessageText}`
                                    : friend.email)
                                : (friend.connectionStatus === 'pending_sent' ? 'Request Sent' : 'Wants to connect')}
                            </span>
                            {friend.connectionStatus === 'pending_received' && (
                              <span className="tg-item-badge blue">!</span>
                            )}
                            {isAccepted && friend.unreadCount > 0 && (
                              <span className="tg-item-badge blue">{friend.unreadCount}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>


            <div className="tg-section">
              <span className="tg-section-header">Explore Users</span>
              <ul className="tg-list">
                {exploreUsersList.length === 0 ? (
                  <p className="tg-no-items">No other users found.</p>
                ) : (
                  exploreUsersList.map(user => {
                    const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
                    const isSelected = selectedFriend?._id === user._id && selectionSource === 'explore';

                    return (
                      <li
                        key={user._id}
                        className={`tg-list-item explore ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedFriend(user);
                          setSelectionSource('explore');
                        }}
                      >
                        <div className="tg-item-avatar placeholder">{initials}</div>
                        <div className="tg-item-body">
                          <div className="tg-item-row">
                            <span className="tg-item-title">{user.name}</span>
                            <span className="tg-item-role">{user.role}</span>
                          </div>
                          <div className="tg-item-row">
                            <span className="tg-item-snippet">{user.email}</span>


                            <div className="tg-action-container">
                              {user.connectionStatus === 'none' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendRequest(user._id);
                                  }}
                                  className="tg-action-btn add-dm"
                                  title="Add to Direct Messages"
                                >
                                  Add
                                </button>
                              )}
                              {user.connectionStatus === 'pending_sent' && (
                                <span className="tg-action-label pending">Sent</span>
                              )}
                              {user.connectionStatus === 'pending_received' && (
                                <div className="tg-double-actions" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => handleAcceptRequest(user._id)} className="tg-action-btn accept" title="Accept">✓</button>
                                  <button onClick={() => handleRejectRequest(user._id)} className="tg-action-btn reject" title="Remove">✗</button>
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

          </div>


          <div className="tg-sidebar-footer">
            <div className="tg-footer-avatar">
              {auth.image ? <img src={auth.image} alt={auth.name} /> : (auth.name ? auth.name.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="tg-footer-info">
              <span className="tg-footer-name">{auth.name || 'User'}</span>
              <span className="tg-footer-email">{auth.role || 'User'}</span>
            </div>
            <button className="tg-logout-btn" title="Log Out" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>

        </aside>


        <main className="telegram-chat-panel">


          <header className="tg-chat-header">
            {selectedFriend && (
              <button
                className="tg-back-btn"
                onClick={() => { setSelectedFriend(null); setSelectionSource(null); }}
                title="Back to Chats"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            {selectedFriend && (
              <div className="tg-header-avatar">
                {selectedFriend.profileImage ? (
                  <img src={selectedFriend.profileImage} alt={selectedFriend.name} />
                ) : (
                  <div className="tg-header-avatar-placeholder">
                    {selectedFriend.name ? selectedFriend.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            )}

            <div className="tg-header-info" style={{ cursor: selectedFriend?.isGroup ? 'pointer' : 'default' }} onClick={() => {
              if (selectedFriend?.isGroup) {
                setEditGroupNameInput(selectedFriend.name);
                setGroupInfoError('');
                setGroupInfoSuccess('');
                setShowGroupInfoModal(true);
              }
            }}>
              {selectedFriend ? (
                <>
                  <h2 className="tg-chat-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedFriend.name}
                    {selectedFriend.isGroup && (
                      <span className="tg-group-info-icon" style={{ fontSize: '14px', color: '#ea580c' }}>ℹ️</span>
                    )}
                  </h2>
                  <span className="tg-chat-status">
                    {selectedFriend.isGroup
                      ? `${selectedFriend.members?.length || 0} members`
                      : (selectedFriend.connectionStatus === 'accepted' ? formatLastSeen(selectedFriend.lastLogin) : selectedFriend.role)}
                  </span>
                </>
              ) : (
                <h2 className="tg-chat-title">Select a chat to start messaging</h2>
              )}
            </div>
          </header>


          <div className="tg-messages-container">

            {selectedFriend ? (
              selectedFriend.isGroup || selectedFriend.connectionStatus === 'accepted' ? (
                <div className="tg-messages-list">
                  {chatMessages.length === 0 ? (
                    <div className="tg-empty-chat-tip">
                      <span>No messages here yet...</span>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.sender && auth.id && (msg.sender._id || msg.sender).toString() === auth.id.toString();
                      const senderName = isMe ? auth.name : (msg.sender?.name || 'User');
                      const senderId = msg.sender?._id || msg.sender;
                      const userColor = getUserColor(senderId);
                      const initials = senderName ? senderName.charAt(0).toUpperCase() : 'U';

                      return (
                        <div key={msg._id} className={`tg-msg-wrapper ${isMe ? 'outgoing' : 'incoming'}`} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', margin: '6px 0', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                          {!isMe && selectedFriend.isGroup && (
                            <div
                              className="tg-msg-avatar"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: userColor,
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                flexShrink: 0,
                                marginBottom: '2px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                              }}
                              title={senderName}
                            >
                              {initials}
                            </div>
                          )}
                          <div className={`tg-msg-bubble ${isMe ? 'outgoing' : 'incoming'}`} style={{ margin: 0 }}>
                            {!isMe && (
                              <span
                                className="tg-msg-author"
                                style={{ color: userColor, fontWeight: '700', fontSize: '12.5px', display: 'block', marginBottom: '3px' }}
                              >
                                {senderName}
                              </span>
                            )}
                            <p className="tg-msg-text">{msg.text}</p>
                            <span className="tg-msg-time">
                              {formatTime(msg.createdAt)}
                              {isMe && <span className="ticks"> ✓✓</span>}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : selectedFriend.connectionStatus === 'pending_sent' ? (
                <div className="tg-empty-workspace">
                  <div className="tg-tip-bubble" style={{ textAlign: 'center' }}>
                    <p>Connection request sent to <strong>{selectedFriend.name}</strong>.</p>
                    <p style={{ fontSize: '12.5px', marginTop: '6px', color: '#a8c2dc' }}>
                      You can start messaging once they accept your request.
                    </p>
                  </div>
                </div>
              ) : selectedFriend.connectionStatus === 'pending_received' ? (
                <div className="tg-empty-workspace">
                  <div className="tg-tip-bubble" style={{ textAlign: 'center' }}>
                    <p><strong>{selectedFriend.name}</strong> sent you a connection request.</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                      <button
                        onClick={() => handleAcceptRequest(selectedFriend._id)}
                        className="tg-action-btn accept"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(selectedFriend._id)}
                        className="tg-action-btn reject"
                        style={{ padding: '6px 14px', fontSize: '12px', marginLeft: 0 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (

                <div className="tg-empty-workspace">
                  <div className="tg-tip-bubble" style={{ textAlign: 'center' }}>
                    <p>You are not connected with <strong>{selectedFriend.name}</strong>.</p>
                    <p style={{ fontSize: '12.5px', marginTop: '6px', color: '#a8c2dc', marginBottom: '12px' }}>
                      Send a connection request to start chatting with them.
                    </p>
                    <button
                      onClick={() => handleSendRequest(selectedFriend._id)}
                      className="tg-action-btn add"
                      style={{ padding: '6px 16px', fontSize: '12.5px' }}
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="tg-empty-workspace">
                <div className="tg-tip-bubble">
                  <p>Select a user from the sidebar list to start chatting.</p>
                </div>
              </div>
            )}
          </div>


          <footer className="tg-chat-footer">
            <form onSubmit={handleSendMessage} className="tg-input-form">
              <button type="button" className="tg-input-icon" title="Attachment">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32a1.5 1.5 0 01-2.12-2.121L16.202 7.42" />
                </svg>
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  selectedFriend
                    ? (selectedFriend.isGroup || selectedFriend.connectionStatus === 'accepted' ? "Write a message..." : "Waiting for connection...")
                    : "Write a message..."
                }
                disabled={!selectedFriend || (!selectedFriend.isGroup && selectedFriend.connectionStatus !== 'accepted')}
                className="tg-text-input"
              />

              <button type="button" className="tg-input-icon" title="Emoji">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
              </button>

              <button type="submit" disabled={!selectedFriend || (!selectedFriend.isGroup && selectedFriend.connectionStatus !== 'accepted') || !inputText.trim()} className="tg-send-btn" title="Send">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </footer>

        </main>


        <aside className={`telegram-profile-sidebar ${showSettingsModal ? 'open' : ''}`}>
          <div className="tg-profile-header">
            <h2 className="tg-profile-title">Profile</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="tg-theme-toggle-btn"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.93 4.93l1.59 1.59m10.96 10.96l1.59 1.59M3 12h2.25m13.5 0H21M4.93 19.07l1.59-1.59m10.96-10.96l1.59-1.59M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
              <button className="tg-profile-close-btn" onClick={() => setShowSettingsModal(false)} title="Close Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="tg-profile-body">

            <div className="tg-profile-card">
              <div className="tg-profile-avatar">
                {auth.name ? auth.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h3 className="tg-profile-name">{auth.name || 'User'}</h3>
              <p className="tg-profile-status">Hey there! I am using Chatify</p>
              <span className="tg-profile-online-badge">Online</span>
            </div>


            <div className="tg-profile-menu">
              <div className="tg-profile-menu-item" onClick={() => setEditProfileMode(!editProfileMode)}>
                <span className="menu-icon">👤</span>
                <span className="menu-text">Account Settings</span>
                <span className="menu-arrow">{editProfileMode ? '▼' : '▶'}</span>
              </div>

              {editProfileMode && (
                <form onSubmit={handleUpdateProfile} className="tg-inline-settings-form">
                  {settingsError && <div className="tg-settings-error">{settingsError}</div>}
                  {settingsSuccess && <div className="tg-settings-success">{settingsSuccess}</div>}
                  <div className="tg-inline-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="tg-inline-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter password to change..."
                    />
                  </div>
                  <div className="tg-inline-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="tg-inline-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="tg-inline-save-btn">Save Changes</button>
                </form>
              )}

              <div className="tg-profile-menu-item">
                <span className="menu-icon">🔒</span>
                <span className="menu-text">Privacy</span>
                <span className="menu-arrow">&rsaquo;</span>
              </div>
              <div className="tg-profile-menu-item">
                <span className="menu-icon">🔔</span>
                <span className="menu-text">Notifications</span>
                <span className="menu-arrow">&rsaquo;</span>
              </div>
              <div className="tg-profile-menu-item" onClick={() => setDarkMode(!darkMode)}>
              <span className="menu-icon">🎨</span>
              <span className="menu-text">Appearance ({darkMode ? 'Dark Mode' : 'Light Mode'})</span>
              <span className="menu-arrow">&rsaquo;</span>
            </div>
              <div className="tg-profile-menu-item">
                <span className="menu-icon">💾</span>
                <span className="menu-text">Data and Storage</span>
                <span className="menu-arrow">&rsaquo;</span>
              </div>
              <div className="tg-profile-menu-item">
                <span className="menu-icon">❓</span>
                <span className="menu-text">Help & Support</span>
                <span className="menu-arrow">&rsaquo;</span>
              </div>
              <div className="tg-profile-menu-item">
                <span className="menu-icon">ℹ️</span>
                <span className="menu-text">About</span>
                <span className="menu-arrow">&rsaquo;</span>
              </div>
            </div>

            <button className="tg-profile-logout-btn" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </aside>

      </div>

      {showRequestsModal && (
        <div className="tg-modal-overlay" onClick={() => setShowRequestsModal(false)}>
          <div className="tg-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="tg-modal-header">
              <h3>Connection Requests</h3>
              <button className="tg-modal-close" onClick={() => setShowRequestsModal(false)}>×</button>
            </div>
            <div className="tg-modal-body" style={{ maxHeight: '450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div className="tg-modal-section">
                <h4 className="tg-modal-section-title">Received Requests ({incomingRequests.length})</h4>
                {incomingRequests.length === 0 ? (
                  <p className="tg-no-requests" style={{ padding: '12px 0' }}>No incoming connection requests.</p>
                ) : (
                  <ul className="tg-requests-list">
                    {incomingRequests.map((reqUser) => {
                      const initials = reqUser.name ? reqUser.name.charAt(0).toUpperCase() : 'U';
                      return (
                        <li key={reqUser._id} className="tg-request-item">
                          <div className="tg-item-avatar placeholder">{initials}</div>
                          <div className="tg-request-info">
                            <span className="tg-request-name">{reqUser.name}</span>
                            <span className="tg-request-email">{reqUser.email}</span>
                          </div>
                          <div className="tg-request-actions">
                            <button
                              onClick={() => handleAcceptRequest(reqUser._id)}
                              className="tg-action-btn accept"
                              title="Accept"
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(reqUser._id)}
                              className="tg-action-btn reject"
                              title="Remove"
                              style={{ padding: '4px 10px', fontSize: '11px', marginLeft: 0 }}
                            >
                              ✗ Remove
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>


              <div className="tg-modal-section">
                <h4 className="tg-modal-section-title">Sent Requests ({sentRequests.length})</h4>
                {sentRequests.length === 0 ? (
                  <p className="tg-no-requests" style={{ padding: '12px 0' }}>No outbound connection requests.</p>
                ) : (
                  <ul className="tg-requests-list">
                    {sentRequests.map((reqUser) => {
                      const initials = reqUser.name ? reqUser.name.charAt(0).toUpperCase() : 'U';
                      return (
                        <li key={reqUser._id} className="tg-request-item">
                          <div className="tg-item-avatar placeholder">{initials}</div>
                          <div className="tg-request-info">
                            <span className="tg-request-name">{reqUser.name}</span>
                            <span className="tg-request-email">{reqUser.email}</span>
                          </div>
                          <div className="tg-request-actions">
                            <button
                              onClick={() => handleRejectRequest(reqUser._id)}
                              className="tg-action-btn cancel"
                              title="Remove Request"
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {showCreateGroupModal && (
        <div className="tg-modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
          <div className="tg-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="tg-modal-header">
              <h3>Create Group</h3>
              <button className="tg-modal-close" onClick={() => setShowCreateGroupModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="tg-modal-body" style={{ maxHeight: '550px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="tg-inline-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: '600', fontSize: '14px', color: darkMode ? '#cbd5e1' : '#475569' }}>Group Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                    placeholder="Enter group name..."
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: '600', fontSize: '14px', color: darkMode ? '#cbd5e1' : '#475569' }}>Select Members (Connected Friends)</label>
                  {friends.filter(f => f.connectionStatus === 'accepted').length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '5px 0' }}>No connected friends to add. Connect with users first.</p>
                  ) : (
                    <div className="tg-members-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                      {friends.filter(f => f.connectionStatus === 'accepted').map(friend => {
                        const isChecked = selectedGroupMembers.includes(friend._id);
                        return (
                          <label key={friend._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedGroupMembers(prev => prev.filter(id => id !== friend._id));
                                } else {
                                  setSelectedGroupMembers(prev => [...prev, friend._id]);
                                }
                              }}
                            />
                            {friend.name}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button type="submit" className="tg-inline-save-btn" style={{ padding: '10px', backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showGroupInfoModal && selectedFriend && selectedFriend.isGroup && (
        <div className="tg-modal-overlay" onClick={() => setShowGroupInfoModal(false)}>
          <div className="tg-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="tg-modal-header">
              <h3>Group Information</h3>
              <button className="tg-modal-close" onClick={() => setShowGroupInfoModal(false)}>×</button>
            </div>
            <div className="tg-modal-body" style={{ maxHeight: '500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {groupInfoError && <div className="tg-settings-error">{groupInfoError}</div>}
              {groupInfoSuccess && <div className="tg-settings-success">{groupInfoSuccess}</div>}


              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                {selectedFriend.admins.some(admin => (admin._id || admin).toString() === auth.id?.toString()) ? (
                  <form onSubmit={handleUpdateGroupName} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', fontSize: '14px', color: darkMode ? '#cbd5e1' : '#475569' }}>Change Group Name</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={editGroupNameInput}
                        onChange={(e) => setEditGroupNameInput(e.target.value)}
                        required
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000' }}
                      />
                      {editGroupNameInput.trim() !== selectedFriend.name && (
                        <button type="submit" className="tg-action-btn accept" style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px' }}>
                          Save
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Group Name</span>
                    <h4 style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: darkMode ? '#fff' : '#1e293b' }}>{selectedFriend.name}</h4>
                  </div>
                )}
              </div>


              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>
                  Members ({selectedFriend.members?.length || 0})
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  {selectedFriend.members?.map(member => {
                    const memberId = (member._id || member).toString();
                    const isCreator = (selectedFriend.creator?._id || selectedFriend.creator)?.toString() === memberId;
                    const isAdmin = selectedFriend.admins.some(admin => (admin._id || admin).toString() === memberId);
                    const isCurrentUserGroupAdmin = selectedFriend.admins.some(admin => (admin._id || admin).toString() === auth.id?.toString());
                    const isMemberMe = memberId === auth.id?.toString();

                    return (
                      <li key={memberId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="tg-item-avatar placeholder" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                            {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                              {member.name} {isMemberMe && '(You)'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {isCreator ? 'Group Creator' : isAdmin ? 'Group Admin' : 'Member'}
                            </span>
                          </div>
                        </div>


                        {isCurrentUserGroupAdmin && !isAdmin && !isCreator && (
                          <button
                            onClick={() => handleMakeGroupAdmin(memberId)}
                            className="tg-action-btn accept"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            title="Give group admin role"
                          >
                            + Make Admin
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}


      {toast.show && (
        <div className={`tg-toast-notification ${toast.type}`}>
          {toast.type === 'success' && <span className="toast-icon">✓</span>}
          {toast.type === 'error' && <span className="toast-icon">✗</span>}
          {toast.type === 'info' && <span className="toast-icon">ℹ</span>}
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
