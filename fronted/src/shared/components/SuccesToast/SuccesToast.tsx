import React, { useEffect, useState } from 'react';
import './SuccesToast.css';

interface PropsSuccesToast {
    isSucces: boolean
    children: React.ReactNode
    successText?: string
}

export const SuccessToast = ({ isSucces, children, successText = "¡Logrado!" }: PropsSuccesToast) => {

    const [show, setShow] = useState(false)

    useEffect(()=>{
        if (isSucces) setShow(true)
    },[isSucces])

    useEffect(() => {
        if (show) {
            setTimeout(() => setShow(false), 3000)
        }
    }, [show])

    return (
        <div className="btn-container">
            {(show) && (
                <div className="success-badge">
                    {successText}
                </div>
            )}
            <div className="btn-main">
                {children}
            </div>
        </div>
    );
};
