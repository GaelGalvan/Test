"use client"
import "../css/services_page.css"
import ServiceCard from "@/components/ServiceCard";
import ServicePageHeading from "@/components/ServicePageHeading";
import { useAppContext } from "@/context";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { getUserSession, createStatelessQ, getInfoSession, deleteSession } from '@/components/DBactions';
import Link from "next/link";
import Favorites from "@/components/Favorites";





export default function Services(){
    const {userResponses, userServices, apiServices, setAPIServices, userEmail, setUserEmail, favorites, setFavorites, setServices, setResponses, numberPlaces, setNumberPlaces} = useAppContext(); //apiServices holds a copy of the services in case the user goes back and returns to page. Also used to avoid extra API calls
    const [clickedService, setClicked] = useState(false); //loading purposes
    const [yes, setyes] = useState(true);
    const [loading, setLoading] = useState(true);



    
    useEffect(() => {
        const fetchProducts = async () => {
        if (yes){
            try{
            setyes(false);
            let userName = await getUserSession();
            if (userName != null) setUserEmail([userName[0].username, userName[0].email]);

            let sessionValues = await getInfoSession();
            if(sessionValues == null || numberPlaces > 0)
                {
                    
                    if(numberPlaces > 0 && sessionValues != null) await deleteSession('Qsession');
                    let email = "HASHTHIS";
                    if(userName)
                    {
                        email = userName[0].email;
                    }
                    let userR = "";
                    if (userResponses){
                        let fuel_type = userResponses.fuel_type;
                        let main_category = userResponses.main_category;
                        let name = userResponses.name;
                        let priceLevel = userResponses.priceLevel;
                        let rating = userResponses.rating;
                        let textQuery = userResponses.textQuery;
                        let types = userResponses.types;
                        userR = { fuel_type,main_category,name,priceLevel,rating,textQuery,types };
                    }
                    await createStatelessQ(numberPlaces, favorites, userServices, apiServices, userR, email);
                }
                else
                {
                    setNumberPlaces(sessionValues.numberPlaces);
                    setFavorites(sessionValues.favorites);
                    setServices(sessionValues.userServices);
                    setResponses(sessionValues.userResponses);
                    setAPIServices(sessionValues.apiServices);
                }
        } catch(error) {
            console.error("Error fetching DB:", error);
            alert("There was an issue getting the data.");
        } finally {
            setLoading(false);
            }
        }
        }
        fetchProducts();
    }, [yes]);
            


    /*
    {setStars([
        ...stars,
        {id: {index}, name: "false"}
    ])}


            console.log(apiServices);
        apiServices.map((service_object, index)=>( 
            setStars([
                ...stars,
                {id: index, name: 'false'}
            ])
        ))

    */


    // if(userResponses.name != "Favorites"){

    // useEffect(()=> {
    //     let change = true;

    //     const getInfo = async ()=> {
    //         try {
    //             const response = await fetch('/api/maps/places', {
    //                 method: "POST",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({userResponses})
    //             });
    //             if (!response.ok) {
    //                 throw new Error(`HTTP error! Status: ${response.status}`);
    //             }
        
    //             const {services_result} = await response.json();
    //             console.log("Service result in services page: "); //debugging purposes
    //             console.log(services_result);
    //             if (change){
    //                 if (services_result) //only replace if there is at least a service 
    //                     setAPIServices(services_result);
    //                 }
    //                 setLoading(false);
                
        
    //         }catch (error) {
    //             console.error("Error fetching API:", error);
    //             alert("There was an issue getting the data.");
    //         }
    //     }
    //     if (!apiServices) //if we already have services from previous call, don't make a new call
    //         {
    //             getInfo();
    //         }
    //     console.log("The apiServices: ") //debugging
    //     console.log(apiServices);
    //     return () => {
    //         change = false;
    //         };
    // }, []);



    if(loading){
        return (<Loading message= "Fetching Session"/>)
    }
    return (
        <div className="full_page bg-secondary">
            <ServicePageHeading />
                <>
                    <div className="container mt-4 ms-4">
                        <div className="fs-2 text-white fw-bold mb-3">
                            Selection:
                        </div>
                        <div className="row row-cols-5 circles mb-2">
                            <div className="col-2" >
                                <div className="h-100 rounded-circle bg-white w-100">
                                    <div className="d-flex justify-content-center align-items-center h-100 fs-5 text-center">
                                        {userResponses.name ? userResponses.name: userResponses.main_category}
                                    </div>
                                </div>
                            </div>  
                        </div>

                    </div>
                    <div className="me-0 ms-4 ps-3">
                        <div className="fs-2 mt-3 text-white fw-bold mb-3 position-relative">
                            Choose your service:
                            {clickedService && 
                            <span className="justify-content-center position-absolute start-50 translate-middle-x">
                                <span className="text-center">Loading...</span>
                            </span>
                            }

                        </div>               
                        <div className="scroll">
                            {apiServices ? apiServices.map((service_object, index)=>(
                                <div className="d-inline-block me-4" key ={index}>
                                    {userEmail != null && <Favorites service={service_object} responses={userResponses}/>} 
                                    <Link href={"/services/" + service_object.displayName.text}>
                                        <div onClick={() => {
                                            setClicked(true);
                                            userServices.push(service_object);
                                        }} >
                                                  
                                            <ServiceCard service = {service_object} has_fuel_type={userResponses.fuel_type}/> 
                                        </div>
                                    </Link>
                                    {/* <div className="card-footer">
                                        {service_object.attributes &&     
                                        <p className="fs-6 text-wrap">Info by: <a href= {service_object.attributes.providerUri}> {service_object.attributes.provider} </a> </p> }
                                        {service_object.photos && service_object.photos[0].authorAttributions[0] &&     
                                        <p className="fs-6 text-wrap">Image By: <a href= {service_object.photos[0].authorAttributions[0].uri}> {service_object.photos[0].authorAttributions[0].displayName} </a> </p> }
                                    </div> */}
                                </div>
                                
                            )):    
                            <div className="text-center"> 
                                <div className="fs-1 text-white loadingSection">No services avaiable based on response. Try to search again </div>
                                <Link href={"/questionaire"}><button className="btn btn-primary">Retry</button></Link>
                            </div>
                            }
     
                        </div>  
                    </div>
                </>
            
 
        </div>
    )
}