import { createContext, useState } from "react";

export const AuthContext = createContext()

export const AuthProvider = ({children})=>{

    const [auth,setAuth]=useState({});

    const accessToken = localStorage.getItem("accessToken");
    // const username = localStorage.getItem("username");
    const image = localStorage.getItem("profileImage");
    const name = localStorage.getItem("name")
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("userId");

    if (accessToken && role && !auth.accessToken) {
        setAuth({ accessToken, role, image, name, id });
    };
    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )

}