
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const UserService = () => {

  const axiosPrivate = useAxiosPrivate()
 // ======================================== register and login ========================================

  const postRegister = async (data) => {
    const response = await axiosPrivate.post("/api/signup", data);
    return response;
  };


  const postLogin = async (data) => {
    const response = await axiosPrivate.post("/api/login", data);
    return response;
  };

  // ======================================== project upload ========================================



  const createProject = async (projectData) => {
    const response = await axiosPrivate.post("/api/projects", projectData);
    return response;
  };

  const getMyProjects = async () => {
    const response = await axiosPrivate.get("/api/projects");
    return response;
  };
  
  const deleteProject = async (projectId) => {
    const response = await axiosPrivate.delete(`/api/projects/${projectId}`);
    return response;
  };
  
  const uploadFile = async (file) => {
    const response = await axiosPrivate.post("/api/upload", file);
    return response;
  };

  const getUsersList = async () => {
    const response = await axiosPrivate.get("/api/connections/users");
    return response;
  };

  const sendConnectionRequest = async (receiverId) => {
    const response = await axiosPrivate.post("/api/connections/request", { receiverId });
    return response;
  };

  const acceptConnectionRequest = async (senderId) => {
    const response = await axiosPrivate.post("/api/connections/accept", { senderId });
    return response;
  };

  const rejectConnectionRequest = async (userId) => {
    const response = await axiosPrivate.post("/api/connections/reject", { userId });
    return response;
  };

  const getConnections = async () => {
    const response = await axiosPrivate.get("/api/connections");
    return response;
  };

  const sendMessage = async (targetId, text, isGroup = false) => {
    const payload = isGroup ? { groupId: targetId, text } : { receiverId: targetId, text };
    const response = await axiosPrivate.post("/api/messages", payload);
    return response;
  };

  const getChatHistory = async (targetId, isGroup = false) => {
    const url = isGroup ? `/api/messages/group/${targetId}` : `/api/messages/${targetId}`;
    const response = await axiosPrivate.get(url);
    return response;
  };

  const createGroup = async (groupData) => {
    const response = await axiosPrivate.post("/api/groups", groupData);
    return response;
  };

  const getGroups = async () => {
    const response = await axiosPrivate.get("/api/groups");
    return response;
  };

  const updateGroupName = async (groupId, name) => {
    const response = await axiosPrivate.put(`/api/groups/${groupId}`, { name });
    return response;
  };

  const makeGroupAdmin = async (groupId, userId) => {
    const response = await axiosPrivate.post(`/api/groups/${groupId}/admins`, { userId });
    return response;
  };

  const updateProfile = async (profileData) => {
    const response = await axiosPrivate.put("/api/profile", profileData);
    return response;
  };

  const getSuperAdminChats = async () => {
    const response = await axiosPrivate.get("/api/superadmin/chats");
    return response;
  };

  const getSuperAdminUsers = async () => {
    const response = await axiosPrivate.get("/api/superadmin/users");
    return response;
  };

  return {
    postLogin,
    postRegister,
    uploadFile,
    createProject,
    getMyProjects,
    deleteProject,
    getUsersList,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    getConnections,
    sendMessage,
    getChatHistory,
    createGroup,
    getGroups,
    updateGroupName,
    makeGroupAdmin,
    updateProfile,
    getSuperAdminChats,
    getSuperAdminUsers
  };
};

export default UserService;