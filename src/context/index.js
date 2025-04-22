"use client";
import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export function AppWrapper ({children}){
    const [userServices, setServices] = useState([]);
    const [numberPlaces, setNumberPlaces] = useState(0);
    const [userResponses, setResponses] = useState(null);
    const [apiServices, setAPIServices] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [guestAddress, setGuestAddress] = useState(null);
    const [favorites, setFavorites] = useState(null);
    const [history, setHistory] = useState(null);

    const contextValues = { //for better practice
        userServices,
        setServices,
        numberPlaces,
        setNumberPlaces,
        userResponses, 
        setResponses,
        apiServices, 
        setAPIServices,
        userEmail,
        setUserEmail,
        guestAddress,
        setGuestAddress,
        favorites,
        setFavorites,
        history,
        setHistory
    }

  return (
    <AppContext.Provider value={contextValues}>{children}</AppContext.Provider>
  );
}

//! when a component calls useAppContext,
export function useAppContext() {
  return useContext(AppContext);
}
