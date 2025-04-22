"use client"
import { useAppContext } from "@/context"
import { redirect } from "next/navigation";
import RouteButton from "@/components/route_button";
import { useState, useEffect, act } from "react";
import { selectHistory, getUserSession, checkService} from "@/components/DBactions";
import Favorites from "@/components/Favorites";
import Loading from "@/components/Loading";
import Image from "next/image";
import { checkIsRoutePPREnabled } from "next/dist/server/lib/experimental/ppr";




export default function History(){
    const current_date = new Date();
    const {userEmail, setUserEmail, history, setHistory} = useAppContext();
    const [changed, setChanged] = useState([false, false]);
    const [collapse, setCollapse] = useState(null);
    const [data, setData] = useState([]); 
    const [futureDate, setFutureDate] = useState([])
    const [isAPIload, setAPIload] = useState(true);
    const [error, setError] = useState(false);
    const [optionSelect, setOptionSelect] = useState([0, {services: "Select Service"}]);
    const [activeTab, setActiveTab] = useState("pastTab");
    const [pastActiveTab, setPastActiveTab] = useState(0);
    const [pastActiveSection, setPastActiveSection] = useState(0);
    const [todayActiveTab, setTodayActiveTab] = useState(0);
    const [todayActiveSection, setTodayActiveSection] = useState(0);

    const [isLoading, setLoading] = useState(true);
    const [isApiLoading, setApiLoading] = useState(true);
    const [doFuture, setDoFuture] = useState(false);
    const [doPast, setDoPast] = useState(false);


    // if (userEmail === null)
    //     redirect("/login");

    useEffect(() => {
        const fetchInfo = async () => {
            try{
                if(!history){
                    let userName = await getUserSession();
                    if (userName != null) setUserEmail([userName[0].username, userName[0].email]);
                    else userName = [{username: userEmail[0], email: userEmail[1]}];
                    const history = await selectHistory(userName[0].email);
                    console.log("HISTORY:")
                    console.log(history);
                    const past_array =  [];
                    let upcoming_array = [];
                    const group_past_array = [];   
                    const group_future_array = [];         
                    history.map((current)=>{
                        if (current.date >= current_date)
                            upcoming_array.push(current);
                        else {
                            past_array.push(current);
                        }
                    });
                    const sorted_past = past_array.sort((a,b) =>  a.date-b.date);
                    
                    sorted_past.map((theCurrent) => {
                        const monthAndDay = `${theCurrent.date.getMonth() + 1}/${theCurrent.date.getDate()}`;
                        let arrayMonthAndDay;
                        if (group_past_array.length > 0) {
                            arrayMonthAndDay = `${group_past_array[group_past_array.length-1][0].date.getMonth() + 1}/${group_past_array[group_past_array.length-1][0].date.getDate()}`
                        }
                        if (arrayMonthAndDay && monthAndDay == arrayMonthAndDay)
                            group_past_array[group_past_array.length-1].push(theCurrent);
                        else 
                            group_past_array.push([theCurrent]);
                    })
                    console.log("GROUP PAST ARRAY")
                    console.log(group_past_array)
                    setData(group_past_array);
                    const sorted_future = upcoming_array.sort((a,b)=>a.date-b.date);
                    sorted_future.map((theCurrent) => {
                        const monthAndDay = `${theCurrent.date.getMonth() + 1}/${theCurrent.date.getDate()}`;
                        let arrayMonthAndDay;
                        if (group_future_array.length > 0) {
                            arrayMonthAndDay = `${group_future_array[group_future_array.length-1][0].date.getMonth() + 1}/${group_future_array[group_future_array.length-1][0].date.getDate()}`
                        }
                        if (arrayMonthAndDay && monthAndDay == arrayMonthAndDay)
                            group_future_array[group_future_array.length-1].push(theCurrent);
                        else 
                        group_future_array.push([theCurrent]);
                    })
                    console.log("GROUP FUTURE ARRAY");
                    console.log(group_future_array);
                    setFutureDate(group_future_array);
                    setHistory({group_past_array: group_past_array, group_future_array: group_future_array});
                    if(group_past_array.length > 0) {
                        setDoPast(true);
                        await fetchApi(0,0,true, {group_past_array: group_past_array, group_future_array: group_future_array});}
                    if(group_future_array.length > 0){
                        setDoFuture(true);
                        await fetchApi(0,0,false, {group_past_array: group_past_array, group_future_array: group_future_array});}
            }
                // setCollapse(Array(group_past_array.length).fill(false));
                } catch(error) {
                    console.error("Error fetching DB:", error);
                    alert("There was an issue getting the data.");
                } finally {
                    setLoading(false);
                    
                }
            }
            fetchInfo();
        }, []);






    console.log("DATA: ")
    console.log(data);

    console.log("FUTURE DATA");
    console.log(futureDate)

    console.log("THIS IS THE HISTORY")
    if(history){
        console.log(history);
    }
            /*
    console.log("FUTURE")
    console.log(futureDate);
    */

    // console.log(collapse)

    // API function calls
    const fetchApi =  async(tab,section, val, inEffect = null) => {
        if(inEffect)
        {
            if(val)var ids = inEffect.group_past_array[tab][section].services;
            else var ids = inEffect.group_future_array[tab][section].services;
        }
        else
        {
            if(val)
            {// We get from past
                var ids = history.group_past_array[tab][section].services   
            }
            else
            {// We get from future
                var ids = history.group_future_array[tab][section].services
            }   
        }
        console.log("THIS IS THE IDS");
        console.log(ids);
        if(inEffect) var temp = inEffect;
        else var temp = history;
        const servicesInformation = [];
        const servicesCalls = ids.map(async id => {
            try {
                const response = await fetch(`/api/maps/places?id=` + id );
                if (response.ok) {
                    const {service_result} = await response.json();
                    if (service_result.photos)
                    try {
                        const img_response = await fetch(`/api/maps/places?thePhoto=` + service_result.photos[0].name);
                        if (img_response.ok) {
                            service_result.photoURL = img_response.url;
                            service_result.photo_image =  img_response.url;
                        }
                    }catch(error) {
                        console.error("Error fetching image for id " + id + ":", error);
                    }
                    service_result.id = id;
                    return service_result;
                }
            }catch(error) {
                console.error("Error fetching service " + id + ":", error);
            }
        });
        const waitCalls = await Promise.all(servicesCalls);
        waitCalls.forEach(result => { 
            if (result) servicesInformation.push(result)
        });
        if(val) temp.group_past_array[tab][section].services = servicesInformation;
        else temp.group_future_array[tab][section].services = servicesInformation;
        setHistory(temp);
        setApiLoading(false);
    }

    // Tabbing
    const tabs = [
        {id: "pastTab", label:"Past"},
        {id: "todayTab", label: "Today"},
    ]

    const tabContent = {
        pastTab: (
            <div className="md:flex">
            <ul className="flex-column space-y space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0 py-5">
            
                {data.map((info, index) => (
                    <li key={index}> 
                    <a className={`inline-flex items-center px-4 py-3 ${pastActiveTab === index? "text-white bg-blue-700 rounded-lg active w-full dark:bg-blue-600" : "rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"}`} 
                    aria-current="page" onClick={() => setPastActiveTab(index)}>
                    <svg className="w-4 h-4 me-2 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/>
                    </svg>
                    {`${info[0].date.getMonth() + 1}/${info[0].date.getDate()}`}
                    </a>
                    </li>
                ))}
            </ul>
           {data.length === 0 ?
            <div className="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No History</h3>
            </div>
            :
            <ul className="flex-column space-y space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0 py-5">
                {data[pastActiveTab].map((info, index) => (
                    <li key={index}> 
                    <a className={`inline-flex items-center px-4 py-3 ${pastActiveSection === index? "text-white bg-blue-700 rounded-lg active w-full dark:bg-blue-600" : "rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"}`} 
                    aria-current="page" onClick={() => setPastActiveSection(index)}>
                    <svg className="w-4 h-4 me-2 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/>
                    </svg>
                    {`${info.date.getMonth() + 1}/${info.date.getDate()} ~ ${info.date.toLocaleString([], {hour: "2-digit", minute: "2-digit"})}`}
                    </a>
                    </li>
                ))
                }
            </ul>
             }
            {(data.length === 0) ?
            <>
            <h1>THIS IS WHATS DISPLAYYING</h1>
            </>
            :
            <>
            {(isApiLoading && isLoading && !doPast ) ?
                <>
                <h1>THIS IS WHATS DISPLAYYING x2</h1>
                </>
                :
             <div className="flex flex-row gap-4 overflow-y-auto">
             {data[pastActiveTab][pastActiveSection].services.map((service, index) => (
                        <div key ={index} className="">
                            <div className="">
                            {userEmail != null && <Favorites service={service}/>}
                            </div> 
                            <div className="w-full max-w-2xs bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 shadow-lg transition ease-in-out delay-100 duration-400 hover:-translate-y-5 mt-5">
                        
                            <Image className = "size-75 object-cover rounded-t-xl" src= {error || !service.photoURL? "https://static.vecteezy.com/system/resources/thumbnails/005/720/408/small_2x/crossed-image-icon-picture-not-available-delete-picture-symbol-free-vector.jpg": service.photoURL } width={100} height={100} onError={() => setError(true)} alt = "Service image" unoptimized = {true} />  
                            <div className="flex items-center px-5 pb-5"> 
                                <h4 className = {`${service.displayName.text.length > 25 ? "text-xl" : "text-2xl"} font-semibold tracking-tight text-gray-900 dark:text-white`}>{service.displayName.text}</h4>
                            </div>
                            <div className="flex items-center mt-2.5 mb-5">
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                    <svg className={service.rating >= 1? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                    <svg className={service.rating >= 2? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                    <svg className={service.rating >= 3? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                    <svg className={service.rating >= 4? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                    <svg className={service.rating >= 5? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                </div>
                                
                                
                                <p className = "bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-sm dark:bg-blue-200 dark:text-blue-800 ms-3"> Rating: {service.rating ? service.rating : "N/A" }</p> 
                                {service.rating && <img className="ms-2 pb-3"  width = "10%" height = "50%" src = "https://th.bing.com/th/id/R.3462ebc891558b2ec8bde920fc3e41c1?rik=E8O%2fhD3daKvtqQ&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fyellow-stars-png-hd-hd-quality-wallpaper-collection-pattern-2000x2000-star-2000.png&ehk=c3jJXJdBQ08FuZM9zuSX6iQGLOq3E56vFYYk59%2fe39I%3d&risl=&pid=ImgRaw&r=0"/>}
                            </div>
                            <div className="flex items-center justify-between">
                            {service.priceRange != null && <p className = "text-1x1 font-bold text-gray-900 dark:text-white">Price Range: {service.priceRange?.startPrice?.units?  "$" + service.priceRange.startPrice.units: "UNKNOWN"} 
                                                                            {service.priceRange?.endPrice?.units? ("-$" + service.priceRange.endPrice.units): (service.priceRange?.startPrice? "-UNKNOWN": "") //this is checking if there are start and end prices. If there is neither, its only UNKNOWN. If start, then start price-UNKNOWN. If both, show both
                                                                            }</p>}
                            </div>
                        </div> 
                        </div>
                        
                    ))
                    }  
                </div>
                }
                </>
                }
        </div>
        
        ),
        todayTab: (
            <div className="md:flex">
            <ul className="flex-column space-y space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0 py-5">
            
                {futureDate.map((info, index) => (
                    <li key={index}> 
                    <a className={`inline-flex items-center px-4 py-3 ${todayActiveTab === index? "text-white bg-blue-700 rounded-lg active w-full dark:bg-blue-600" : "rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"}`} 
                    aria-current="page" onClick={() => setTodayActiveTab(index)}>
                    <svg className="w-4 h-4 me-2 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/>
                    </svg>
                    {`${info[0].date.getMonth() + 1}/${info[0].date.getDate()}`}
                    </a>
                    </li>
                ))}
            </ul>
           {futureDate.length === 0 ?
            <div className="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No History</h3>
            </div>
            :
            <ul className="flex-column space-y space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0 py-5">
                {futureDate[todayActiveTab].map((info, index) => (
                    <li key={index}> 
                    <a className={`inline-flex items-center px-4 py-3 ${todayActiveSection === index? "text-white bg-blue-700 rounded-lg active w-full dark:bg-blue-600" : "rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"}`} 
                    aria-current="page" onClick={ () => setTodayActiveSection(index)}>
                    <svg className="w-4 h-4 me-2 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/>
                    </svg>
                    {`${info.date.getMonth() + 1}/${info.date.getDate()} ~ ${info.date.toLocaleString([], {hour: "2-digit", minute: "2-digit"})}`}
                    </a>
                    </li>
                ))
                }
            </ul>
             }
            {(futureDate.length === 0) ?
            <>
            </>
            :
            <>
            {(isApiLoading && isLoading && !doFuture ) ?
                <>
                </>
                :
             <div className="flex flex-row gap-4 overflow-y-auto">
             {futureDate[todayActiveTab][todayActiveSection].services.map((service, index) => (
                        <div key ={index} className="">
                            <div className="">
                            {userEmail != null && <Favorites service={service}/>}
                            </div> 
                            <div className="w-full max-w-2xs bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 shadow-lg transition ease-in-out delay-100 duration-400 hover:-translate-y-5 mt-5">
                        
                            <Image className = "size-75 object-cover rounded-t-xl" src= {error || !service.photoURL? "https://static.vecteezy.com/system/resources/thumbnails/005/720/408/small_2x/crossed-image-icon-picture-not-available-delete-picture-symbol-free-vector.jpg": service.photoURL } width={100} height={100} onError={() => setError(true)} alt = "Service image" unoptimized = {true} />  
                            <div className="flex items-center px-5 pb-5"> 
                                <h4 className = {`${service.displayName.text.length > 25 ? "text-xl" : "text-2xl"} font-semibold tracking-tight text-gray-900 dark:text-white`}>{service.displayName.text}</h4>
                            </div>
                            <div className="flex items-center mt-2.5 mb-5">
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                    <svg className={service.rating >= 1? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                    <svg className={service.rating >= 2? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                    <svg className={service.rating >= 3? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                    <svg className={service.rating >= 4? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                    <svg className={service.rating >= 5? "w-4 h-4 text-yellow-300":"w-4 h-4 text-gray-200 dark:text-gray-600"} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                                    </svg>
                                </div>
                                
                                
                                <p className = "bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-sm dark:bg-blue-200 dark:text-blue-800 ms-3"> Rating: {service.rating ? service.rating : "N/A" }</p> 
                                {service.rating && <img className="ms-2 pb-3"  width = "10%" height = "50%" src = "https://th.bing.com/th/id/R.3462ebc891558b2ec8bde920fc3e41c1?rik=E8O%2fhD3daKvtqQ&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fyellow-stars-png-hd-hd-quality-wallpaper-collection-pattern-2000x2000-star-2000.png&ehk=c3jJXJdBQ08FuZM9zuSX6iQGLOq3E56vFYYk59%2fe39I%3d&risl=&pid=ImgRaw&r=0"/>}
                            </div>
                            <div className="flex items-center justify-between">
                            {service.priceRange != null && <p className = "text-1x1 font-bold text-gray-900 dark:text-white">Price Range: {service.priceRange?.startPrice?.units?  "$" + service.priceRange.startPrice.units: "UNKNOWN"} 
                                                                            {service.priceRange?.endPrice?.units? ("-$" + service.priceRange.endPrice.units): (service.priceRange?.startPrice? "-UNKNOWN": "") //this is checking if there are start and end prices. If there is neither, its only UNKNOWN. If start, then start price-UNKNOWN. If both, show both
                                                                            }</p>}
                            </div>
                        </div> 
                        </div>
                        
                    ))
                    }  
                </div>
                }
                </>
            }
        </div>
        )
    }


    if(isLoading && isApiLoading){
        return (<Loading message= "Fetching History"/>)
    }
    else { 
        return(
            <>
            <a href="/home"
            className="inline-flex items-center border text-white-600 border-b-2 border-blue-600 rounded-md hover:bg-indigo-300 ">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18">
            </path>
            </svg>
            <span className="ml-1 font-bold text-lg"> Home </span>
            </a>
            {(data.length === 0 && futureDate.length === 0) ?
            <div className="container w-100 vh-100 mt-4">   
            <div>
                <h2>No Previous History. Make one to show up here!</h2>
                <RouteButton name ={"Make Plan!"} location={"/start"} />
            </div>
            
            </div>
            :
            <div>


                
                <div className="flex flex-wrap boarder-b">
                    {tabs.map((tab) => (
                        <button key={tab.id} className={`inline-block p-4 ${activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600 rounded-t-lg active dark:text-blue-500 dark:border-blue-500" 
                            : "border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"}`} onClick={() => setActiveTab(tab.id)}>
                                {tab.label}
                            </button>
                    ))}
                </div>
                <div>
                    {tabContent[activeTab]}
                </div>
            </div>
            }
            </>
        )
    }
}