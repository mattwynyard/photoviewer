import { React, useContext  } from 'react';
import { loginContext } from '../context/loginContext'
import { LayerCard } from './LayerCard';

const LayerManager = (props) => {
    const { login, showLoader, hideLoader} = useContext(loginContext);

    if (props.layer) {
        return (
            <LayerCard
                classtitle={'layermanager'}
                layer={props.layer}
                prioritytitle={props.prioritytitle}
                priorityitems={props.priorityitems}
                priorityfilter={props.priorityfilter} 
                priorityonClick={props.updatePriority}
                classitems={props.rmclass ? props.rmclass: []}
                classfilter={props.filterRMClass} 
                classonClick={props.classonClick}
                setDataActive={props.setDataActive} //-> data table
                setMapMode={props.setMapMode}
                mapMode={props.mapMode}
                dataChecked={props.dataActive} //-> data table
                login={login.user}
                spin={showLoader}
                stopSpin={hideLoader}
            >           
            </LayerCard>
        );
        } else {
            return null;
        }
}

export { LayerManager }