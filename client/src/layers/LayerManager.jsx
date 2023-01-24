import { React } from 'react';
import { LayerCard } from './LayerCard';
import { useSelector } from 'react-redux'

const LayerManager = (props) => {
    const active = useSelector((state) => state.layers.active)
    if (active) {
        return (
            <LayerCard
                classtitle={'layermanager'}
                layer={active}
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