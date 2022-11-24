import { React } from 'react';
import { LayerCard } from './LayerCard';

const LayerManager = (props) => {

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
                dataChecked={props.dataActive} //-> data table
            >           
            </LayerCard>
        );
        } else {
            return null;
        }
}

export { LayerManager }