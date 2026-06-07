let circuit = {}
let simulated = []
let json_data = {}

async function get_data(filePath) {
  try {
    const response = await fetch(new URL(filePath, document.currentScript.src));
    
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

console.log(new URL(document.currentScript.src))

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
    circuit.blocks.push({id: block, power: power, x: Number(x), y: Number(y), z: Number(z), data: data})
    return circuit.blocks.length // Block ID (Starts at 1))
}

function connect(start, end) {
    circuit.connections.push([start, end]) // Connect from block IDs
}

function addBuilding(building, x, y, z, front_vector = [0, 0, 1], up_vector = [0, 1, 0], right_vector = buildingRightVector(front_vector, up_vector)) {
    circuit.buildings.push({id: building, x: x, y: y, z: z, front_vector: front_vector, up_vector: up_vector, right_vector: right_vector, connections: [], data:[]})
    return circuit.buildings.length - 1 // Building does not have a referenced ID but it is easier to at 0 to index with arrays
}

function setBuildingData(building = 0, data = []) {
    circuit.buildings[building].data = data
}

function connectBuilding(block = 1, building = 0, building_node, input = false) {
    let buildingId = circuit.buildings[building].id
    let building_node_index = json_data.building_data[buildingId].findIndex(item => item.name === building_node)
    circuit.buildings[building].connections[building_node_index] ||= []
    circuit.buildings[building].connections[building_node_index].push(+input + String(block))
}

function buildingRightVector(front_vector, up_vector) {
    // Cross product of front and up vectors
    return [
        front_vector[1] * up_vector[2] - front_vector[2] * up_vector[1],
        front_vector[2] * up_vector[0] - front_vector[0] * up_vector[2],
        front_vector[0] * up_vector[1] - front_vector[1] * up_vector[0]
    ]
}

function decompile(saveData = "???") {
    let save_segments = saveData.split("?")
    for (let block of save_segments[0].split(";")) {
        let data = block.split(",")
        let extra_data
        if (data[5]) {
            extra_data = data[5].split("+")
        } else {
            extra_data = []
        }
        addBlock(data[0], data[2], data[3], data[4], extra_data, data[1])
    }
    for (let connection of save_segments[1].split(";")) {
        let data = connection.split(",")
        connect(data[0], data[1])
    }
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
    let compiled_building_data = []
    for (let building of circuit.buildings) {
        compiled_buildings.push(`${building.id},${building.x},${building.y},${building.z},${building.front_vector.join(',')},${building.up_vector.join(',')},${building.right_vector.join(',')},${building.connections.map(innerArray => innerArray.join('+')).join(',')}`)
        if (building.id == "Assembler") {
            let o = []
            for (let entry of building.data) {
                o.push(entry[0] + "//" + entry[1])
            }
            compiled_building_data.push(o.join("||"))
        } else if (building.id = "Sign") {
            compiled_building_data.push([...building.data].map(char => char.charCodeAt(0).toString(16)).join(""))
        } else {
            compiled_building_data.push()
        }
    }

    let result = [compiled_blocks.join(';'), compiled_connections.join(';'), compiled_buildings.join(';'), compiled_building_data.join(';')].join('?')
    console.log(`Successfully comiled: ${result}`)
    return result
}

function copy(data) {
    navigator.clipboard.writeText(data).then(() => {
    }).catch(err => {
        alert("Failed to copy circuit: " + err)
    })
}

window.getCircuit = function () { if (circuit && Object.keys(circuit).length > 0) {return circuit} else { return null} }
window.addBlock = addBlock
window.connect = connect
window.addBuilding = addBuilding
window.setBuildingData = setBuildingData
window.connectBuilding = connectBuilding

window.compile = compile
window.decompile = decompile

window.copy = copy