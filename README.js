import xml.etree.ElementTree as ET
from pathlib import Path

# List of module pom paths
pom_paths = [
    "module1/pom.xml",
    "module2/pom.xml",
    "module3/pom.xml",
]

# Create a basic structure for the merged pom
merged_root = ET.Element("project", xmlns="http://maven.apache.org/POM/4.0.0")
ET.SubElement(merged_root, "modelVersion").text = "4.0.0"
ET.SubElement(merged_root, "groupId").text = "com.example"
ET.SubElement(merged_root, "artifactId").text = "merged-project"
ET.SubElement(merged_root, "version").text = "1.0.0"
ET.SubElement(merged_root, "packaging").text = "pom"
dependencies = ET.SubElement(merged_root, "dependencies")

# Helper to avoid duplicate dependencies
seen_dependencies = set()

def get_dependency_key(dep_elem):
    gid = dep_elem.findtext("{http://maven.apache.org/POM/4.0.0}groupId")
    aid = dep_elem.findtext("{http://maven.apache.org/POM/4.0.0}artifactId")
    return f"{gid}:{aid}"

# Extract dependencies from each module pom
for path in pom_paths:
    tree = ET.parse(path)
    root = tree.getroot()
    deps = root.find("{http://maven.apache.org/POM/4.0.0}dependencies")
    if deps is not None:
        for dep in deps.findall("{http://maven.apache.org/POM/4.0.0}dependency"):
            key = get_dependency_key(dep)
            if key not in seen_dependencies:
                seen_dependencies.add(key)
                dependencies.append(dep)

# Write merged POM
tree = ET.ElementTree(merged_root)
tree.write("merged-pom.xml", encoding="utf-8", xml_declaration=True)
print("Merged POM written to merged-pom.xml")