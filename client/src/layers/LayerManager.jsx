import { React, useContext  } from 'react';
import { loginContext } from '../login/loginContext'
import { LayerCard } from './LayerCard';


const LayerManager = (props) => {
    const { login, showLoader, hideLoader } = useContext(loginContext);

    if (props.layer) {
        return (
            <LayerCard
                classtitle={'RM Class'}
                layer={props.layer}
                prioritytitle={props.prioritytitle}
                priorityitems={props.priorityitems}
                prioritylogin={login.user}
                priorityreverse={props.reverse}
                priorityfilter={props.priorityfilter} 
                //priorityonClick={updatePriority}
                
                classitems={props.rmclass ? props.rmclass: []}
                classlogin={login.user}
                classfilter={props.filterRMClass} 
                //classonClick={updateRMClass}
                setDataActive={props.setDataActive} //-> data table
                setMapMode={props.setMapMode}
                mapMode={props.mapMode}
                dataChecked={props.dataActive} //-> data table
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