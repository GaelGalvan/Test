"use client"
import "../css/address_page.css"
import { useState } from "react"
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { addUser, updateUserAddress } from "@/components/DBactions";
function AddressPage(){
    const router = useRouter();
    const [theInput, setInput] = useState('');
    const [selectType, setSelect] = useState('');
    const searchParams = useSearchParams();
    const search = searchParams.get('user');
    let userName;
    let other;
    if (!search)
        router.back();
    else {
        [userName, other] = search.split('@');
        userName = userName.toUpperCase();
    }


    const handleChange = (event) => {
        setInput(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log("submitted address:", theInput);
        try {
            await updateUserAddress(search, theInput);
            router.push(`/start?user=${search}`); // pass user email to start page
        } catch (error) {
            console.error("error updating user address:", error.message);
        }
    };

    const formCheck = async (event) => {
        event.preventDefault();
        if (selectType == '')
            alert("Select an option");
        else {
            try {
                console.log("formCheck function called");
                const response = await fetch('/api/validate/zipCode', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userInput: theInput, userSelection: selectType }),
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            
                const returnData = await response.json();
                if (!returnData.isValid) {
                    if (selectType == "zipCode")
                        alert("Enter a valid ZIP Code");
                    else if (selectType == "address")
                        alert("Enter a valid address");
                }
                else {
                    router.push("/start");
                }
        
            } catch (error) {
                console.error("Error fetching API:", error);
                alert("There was an issue validating the input.");
            }
        }
    

    };

    return (
        <>
            <div className="bg-secondary-subtle">
                <div className="text-center">
                    <h1 className='fs-2 fw-bold'>Welcome {userName}!</h1>
                </div>
            </div>
            <div className="d-flex justify-content-center align-items-center vh-100 bg-secondary">
                <div className="bg-secondary-subtle main_container">
                    <p className="text-center main_text">Please enter either your physical address or your Zip Code. </p>
                    <p className="text-center main_text fw-bold">(Recommend address for best experience).</p>
                    <div className="ms-5 mt-5">
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="addressInput" className="form-label fs-3">Address/ZipCode</label>
                            <div className="row row-cols-3 m-0 p-0">
                                <div className="col-8">
                                    <input id="addressInput" value={theInput} className="form-control" onChange={handleChange} type="text" placeholder="Enter your address here" />
                                </div>
                                <div className="col-2">
                                    <select value={selectType} className="form-select w-100" onChange={(event) => setSelect(event.target.value)}>
                                        <option value="" disabled>Select your type</option>
                                        <option value="zipCode">Zip Code</option>
                                        <option value="address">Address</option>
                                    </select>
                                </div>
                                <div className="col-1">
                                    <button type="submit" className="btn btn-primary w-100">Enter</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>    
        </> 
    )

}

export default AddressPage;