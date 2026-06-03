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


function get_block_data(name = "NOR") {
    return json_data.block_data.find(item => item.id == name)
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

function block_behaivior(block_id = 0, previous = 0, inputs = [], rising_edge = []) {
    let out;
    switch (block_id) {
        case 0: {
            out = 1;
            for (let i in inputs) {
                if (i == 1) {
                    out = 0;
                    break;
                }
            }
            break;
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
}

function update() {
    let new_circuit = circuit;
    
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

function connectBuilding(block, building, building_node, input) {
    let building_node_index = json_data.building_data[circuit.buildings[building].id][building_node].findIndex(item => item.name === building_node)
    circuit.buildings[building].connections[building_node_index].push(String(block))
}

function getRightVector(front_vector, up_vector) {
    // Cross product of front and up vectors
    return [
        front_vector[1] * up_vector[2] - front_vector[2] * up_vector[1],
        front_vector[2] * up_vector[0] - front_vector[0] * up_vector[2],
        front_vector[0] * up_vector[1] - front_vector[1] * up_vector[0]
    ]
}

function compile() {
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
        compiled_buildings.push(`${building.id},${building.x},${building.y},${building.z},${building.front_vector.join(',')},${building.up_vector.join(',')},${getRightVector(building.front_vector, building.up_vector).join(',')}`)
    }
    return [compiled_blocks.join(';'), compiled_connections.join(';'), compiled_buildings.join(';')].join('?') + "?"
}

function copy(circuit) {
    navigator.clipboard.writeText(circuit).then(() => {
        // alert("Circuit copied to clipboard!")
    }).catch(err => {
        alert("Failed to copy circuit: " + err)
    })
}1