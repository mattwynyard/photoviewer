import { React, useContext  } from 'react';
import { loginContext } from '../login/loginContext'
import { LayerCard } from './LayerCard';

const LayerManager = (props) => {
    const { login, showLoader, hideLoader} = useContext(loginContext);

//       loadLayer = async (mode, project) => {  
//     this.context.showLoader();    
//     let projectCode = project.code;
//     let inspections = null;
//     let request = {project: project.code, query: null}
//     //if (mode === "road") {
//       let body = await apiRequest(this.context.login, request, "/age"); //fix for footpaths
//       if(!body) return;
//       if (!body.error) {
//         inspections = this.buildInspections(body)
//       } else {
//         return;
//       } 
//     // } else {
//     //   inspections = [];
//     // }
//     let district = await apiRequest(this.context.login, request, "/district");
//     if (district.error) return; 
//     request = {project: project, query: null}
//     let filter = await apiRequest(this.context.login, request, "/filterData");
//     if (filter.error) return; 
//     let storeFilter = await apiRequest(this.context.login, request, "/filterData");
//     if (storeFilter.error) return; 
//     let filters = await this.buildFilter(filter);
//     let store = await this.buildFilter(storeFilter);
//     let layers = this.state.activeLayers;
//     layers.push(project);
//     let layerBody = await apiRequest(this.context.login, request, "/layerdropdowns");
//     let priorities = this.buildPriority(layerBody.priority, project.priority, project.ramm); 
//     if (layerBody.rmclass) {
//       this.setState({rmclass: layerBody.rmclass});
//       this.setState({filterRMClass: layerBody.rmclass})  
//     }     
//     this.setState(() => ({
//       filterPriorities: priorities.filter, 
//       priorities: priorities.priorities,
//       rmclass: layerBody.rmclass,
//       filterRMClass: layerBody.rmclass,
//       filterStore: store,
//       filters: filters,
//       activeLayer: project,
//       activeLayers: layers,
//       district: district,
//       inspections: inspections,
//       activeProject: projectCode,
//       projectMode: mode,
//       priorityMode: mode === "road" ? "Priority": "Grade",
//       bucket: this.buildBucket(projectCode),
//     }), async function() { 
//       let body = await this.filterLayer(project); //fetch layer
//       this.addGLGeometry(body.points, body.lines, body.type, true);
//     });
//   }

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