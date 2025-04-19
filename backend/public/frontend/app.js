const canvas = document.getElementById('canvas');
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
canvas.appendChild(svg);

let nodes = [];
let connections = [];
let selectedNode = null;
let offsetX, offsetY;

// Node Management
function addNode() {
    const node = document.createElement('div');
    node.className = 'node';
    node.textContent = `Stage ${nodes.length + 1}`;
    node.style.left = '50px';
    node.style.top = '50px';
    
    node.addEventListener('mousedown', startDrag);
    canvas.appendChild(node);
    nodes.push(node);
}

function startDrag(e) {
    selectedNode = e.target;
    offsetX = e.clientX - selectedNode.offsetLeft;
    offsetY = e.clientY - selectedNode.offsetTop;
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

function drag(e) {
    if (!selectedNode) return;
    selectedNode.style.left = `${e.clientX - offsetX}px`;
    selectedNode.style.top = `${e.clientY - offsetY}px`;
    updateConnections();
}

function stopDrag() {
    selectedNode = null;
    document.removeEventListener('mousemove', drag);
}

// Connection Management
function updateConnections() {
    // Clear existing connections
    svg.innerHTML = '';
    
    // Draw new connections
    connections.forEach(([nodeA, nodeB]) => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.classList.add('connection');
        line.setAttribute('x1', nodeA.offsetLeft + 60);
        line.setAttribute('y1', nodeA.offsetTop + 20);
        line.setAttribute('x2', nodeB.offsetLeft + 60);
        line.setAttribute('y2', nodeB.offsetTop + 20);
        svg.appendChild(line);
    });
}

// Right-click to connect nodes
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (nodes.length < 2) return;
    
    const nodeA = nodes[nodes.length - 2];
    const nodeB = nodes[nodes.length - 1];
    connections.push([nodeA, nodeB]);
    updateConnections();
});

// API Integration
async function saveWorkflow() {
    if (nodes.length === 0) {
      alert('Create at least one stage!');
      return;
    }
  
    const workflowData = {
      nodes: nodes.map(node => ({
        x: node.offsetLeft,
        y: node.offsetTop,
        text: node.textContent
      })),
      connections: connections.map(([nodeA, nodeB]) => ({
        a: nodes.indexOf(nodeA),
        b: nodes.indexOf(nodeB)
      }))
    };
  
    try {
      const response = await fetch('http://localhost:3000/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });
  
      if (!response.ok) throw new Error('Failed to save');
      const { id } = await response.json();
      alert(`Saved as ID: ${id}`);
      
    } catch (error) {  // <- Missing catch block added
      console.error('Save error:', error);
      alert('Error saving workflow!');
    }
  }
  
async function loadWorkflow() {
    const id = document.getElementById('loadId').value;
    if (!id) return;
  
    try {
      const response = await fetch(`http://localhost:3000/load/${id}`);
      const data = await response.json();
      const workflowData = JSON.parse(data.data);
  
      // Clear existing nodes/connections
      nodes.forEach(node => node.remove());
      nodes = [];
      connections = [];
      svg.innerHTML = '';
  
      // Recreate nodes
      workflowData.nodes.forEach(nodeData => {
        const node = document.createElement('div');
        node.className = 'node';
        node.textContent = nodeData.text;
        node.style.left = `${nodeData.x}px`;
        node.style.top = `${nodeData.y}px`;
        node.addEventListener('mousedown', startDrag);
        canvas.appendChild(node);
        nodes.push(node);
      });
  
      // Recreate connections using saved indices
      workflowData.connections.forEach(conn => {
        connections.push([nodes[conn.a], nodes[conn.b]]);
      });
      updateConnections(); // Draw lines
  
    } catch (error) {
      alert('Error loading workflow!');
    }
  }