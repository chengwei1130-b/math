d3.json("data.json").then(function(data) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select("#mindmap-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2}) scale(0.7)`);

    const root = d3.hierarchy(data);
    let nodes = root.descendants();
    let links = root.links();

    nodes.forEach((d, i) => {
        d.id = i;
        d.radius = d.depth === 0 ? 80 : d.depth === 1 ? 70 : 50;
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-800))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => d.radius + 40));

    const link = g.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", "#111")
        .attr("stroke-width", 5);

    const node = g.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

    node.append("ellipse")
        .attr("rx", d => d.radius * 2.5)
        .attr("ry", d => d.radius * 1.8)
        .attr("fill", d => d.depth === 0 ? "#FFCC00" : d.depth === 1 ? "#FF6600" : d.depth === 2 ? "#0099FF" : "#66CC66")
        .attr("stroke", d => d.parent ? getOutlineColor(d.parent) : "black")
        .attr("stroke-width", d => d.depth > 0 ? 6 : 3);

    function getOutlineColor(parent) {
        if (parent.data.depth === 1) return "#FF6600"; 
        if (parent.data.depth === 2) return "#0099FF";
        return "black";
    }

    node.append("text")
        .attr("dx", 0)
        .attr("dy", 5)
        .style("text-anchor", "middle")
        .text(d => d.data.name)
        .style("fill", "#333")
        .style("font-size", "18px")
        .call(wrapText, 180);

    simulation.nodes(nodes).on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    simulation.force("link").links(links);

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    function wrapText(text, width) {
        text.each(function() {
            const text = d3.select(this);
            const words = text.text().split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            let lineHeight = 1.2;
            const y = text.attr("dy");
            const x = text.attr("dx");
            let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y);

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").text(word);
                }
            }
        });
    }

    const zoomControls = d3.select("body").append("div")
        .style("position", "fixed")
        .style("top", "20px")
        .style("left", "20px")
        .style("background", "white")
        .style("padding", "10px")
        .style("border", "1px solid #ccc");

    zoomControls.append("button")
        .text("+")
        .on("click", () => {
            svg.transition().duration(300).call(zoom.scaleBy, 1.2);
        });

    zoomControls.append("button")
        .text("-")
        .on("click", () => {
            svg.transition().duration(300).call(zoom.scaleBy, 0.8);
        });
});