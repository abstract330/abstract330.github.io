let circuit = []
let simulated = []
let json_data = {}

async function get_data(filePath) {
  try {
    const response = await fetch(filePath);
    
    // Check if the file actually exists
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to load JSON file:", error);
  }
}


get_data("block_data.json").then(data => {json_data.block_data = data})
get_data("building_data.json").then(data => {json_data.building_data = data})


function block(name = "NOR") {
    return json_data.block_data.findIndex(item => item.id == name)
}

function reset() {
    circuit = {
        blocks: [],
        connections: [],
        buildings: [],
        building_data: []
    }
    simulated = {
        force_powered: [],
        delay_data: [],
        rising_edge: []
    }
}


function update() {
    let new_circuit = circuit;
    function block_behaivior(block) {
        let out;
        switch (circuit.blocks[block].id) {
            case 0: {
                for (let i in inputs) {
                    if (i == 1) {
                        return 0;
                    }
                }
                return 1;
            }
            case 1: {
                out = 1;
                for (let i in inputs) {
                    if (i == 0) {
                        out = 0;
                        break
                    }
                }
                break
            }
            case 2: {
                out = 0;
                for (let i in inputs) {
                    if (i == 1) {
                        out = 1;
                        break;
                    }
                }
                break
            }
            case 3: {
                out = 0;
                for (let i in inputs) {
                    if (i == 1) {
                        out = 1 - out
                    }
                }
                break
            }
            case 4: {
                out = 0;
                for (let i in inputs) {
                    if (i == 1) {
                        out = 1
                        break
                    }
                }
                break
            }
            case 5: {
                out = previous
                for (let i in rising_edge) {
                    if (i == 1) {
                        out = 1 - out
                        break
                    }
                }
                break
            }
            case 6: {
                out = 0;
                for (let i in inputs) {
                    if (i == 1) {
                        out = 1
                        break
                    }
                }
                break
            }
            case 7: {
                out = 0;
                for (let i in inputs) {
                    if (i == 1) {
                        out = 1
                        break
                    }
                }
                break
            }

        }
        return out;
    }
}

function addBlock(block, x, y, z, data = [], power = 0) {
    circuit.blocks.push({id: block, power: power, x: x, y: y, z: z, data: data})
    return circuit.blocks.length // Block ID (Starts at 1))
}

function connect(start, end) {
    circuit.connections.push([start, end]) // Connect from block IDs
}

function addBuilding(building, x, y, z, front_vector = [0, 0, 1], up_vector = [0, 1, 0], right_vector = getRightVector(front_vector, up_vector)) {
    circuit.buildings.push({id: building, x: x, y: y, z: z, front_vector: front_vector, up_vector: up_vector, right_vector: right_vector, connections: []})
    return circuit.buildings.length - 1 // Building does not have a referenced ID but it is easier to at 0 to index with arrays
}

function connectBuilding(block = 1, building = 0, building_node, input = false) {
    let buildingId = circuit.buildings[building].id
    let building_node_index = json_data.building_data[buildingId].findIndex(item => item.name === building_node)
    circuit.buildings[building].connections[building_node_index] ||= []
    circuit.buildings[building].connections[building_node_index].push(+input + String(block))
}

function getRightVector(front_vector, up_vector) {
    // Cross product of front and up vectors
    return [
        front_vector[1] * up_vector[2] - front_vector[2] * up_vector[1],
        front_vector[2] * up_vector[0] - front_vector[0] * up_vector[2],
        front_vector[0] * up_vector[1] - front_vector[1] * up_vector[0]
    ]
}

async function compile() {
    // Convert circuit object into CM2 register format
    let compiled_blocks = []
    for (let block of circuit.blocks) {
        compiled_blocks.push(`${block.id},${block.power},${block.x},${block.y},${block.z},${block.data.join('+')}`)
    }
    let compiled_connections = []
    for (let connection of circuit.connections) {
        compiled_connections.push(`${connection[0]},${connection[1]}`)
    }
    let compiled_buildings = []
    for (let building of circuit.buildings) {
        compiled_buildings.push(`${building.id},${building.x},${building.y},${building.z},${building.front_vector.join(',')},${building.up_vector.join(',')},${building.right_vector.join(',')},${building.connections.map(innerArray => innerArray.join('+')).join(',')}`)
    }

    let result = [compiled_blocks.join(';'), compiled_connections.join(';'), compiled_buildings.join(';')].join('?') + "?"
    console.log(`Successfully comiled: ${result}`)
    return result
}

function copy(data) {
    navigator.clipboard.writeText(data || result).then(() => {
    }).catch(err => {
        alert("Failed to copy circuit: " + err)
    })
}