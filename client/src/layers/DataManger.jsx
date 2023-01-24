import { LayerManager } from 'LayerManager';
import Filter from '../components/Filter.js';
import {FilterButton} from '../components/FilterButton.js';

const DataManager = () => {
    return (
        <>
            <div className="layers">
                <div className="layerstitle">
                <p>Layers</p>
                </div> 
                <LayerManager
                    layer={this.state.activeLayer}
                    prioritytitle={this.state.priorityMode}
                    priorityitems={this.state.priorities}
                    priorityfilter={this.state.filterPriorities} 
                    classitems={this.state.rmclass ? this.state.rmclass: []}
                    classfilter={this.state.filterRMClass} 
                    setDataActive={this.setDataActive} //-> data table
                    dataChecked={this.state.dataActive} //-> data table
                    setMapMode={this.state.setMapMode}
                    updatePriority={this.updatePriority}
                    classonClick={this.updateRMClass}
                    
                    >
                </LayerManager>       
                </div>
                <div className="filters">
                <div className="filterstitle">
                    <p>Filters</p>
                </div>
                <Filter
                    filter={this.state.filters}
                    store={this.state.filterStore}
                    mode={this.state.activeLayer ? this.state.activeLayer.surface: null}
                    update={this.updateFilter}
                />
                <FilterButton
                    className="apply-btn" 
                    ref={this.applyRef} 
                    layer={this.state.activeLayer} 
                    onClick={(e) => this.clickApply(e)}>  
                </FilterButton>
            </div>
        </>
    )
}