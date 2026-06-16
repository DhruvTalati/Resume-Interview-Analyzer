import { createContext , useState} from "react";

export const AuthContext = createContext()

export const AAuthProvider = {{children}}=>{

    const {user,setUser} = useState(null);
    const [loading, setLoading] = useState(false)
}