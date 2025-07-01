# Diane UI - Teleoperation VR Interface

This is the UI for the Diane project, a teleoperation interface based on React and WebXR designed primarily for use with VR headsets.

## Features

- **Robot Selection**: You can select the robot to teleoperate from the list of available ones
- **Point Cloud Reception**: Once a robot is selected, you will receive real-time point clouds
- **VR Control**: Use VR controllers to move the robot in reality
- **WebXR Interface**: VR website optimized for virtual reality headsets

## Installation

To install the client, clone the repository and install dependencies using npm:

```bash
npm install
```

## Usage

You can start the application in two ways:

### Method 1: Development with Vite
```bash
npx vite --host
```

### Method 2: Docker
```bash
./run.sh
```

---

## Cite us
If you use this code in your work, please cite the DIANE project as follows:

```
@inproceedings{10.1145/3712676.3719263,
  author = {Barone, Nunzio and Brescia, Walter and Santangelo, Gabriele and Maggio, Antonio Pio and Cisternino, Ivan and De Cicco, Luca and Mascolo, Saverio},
  title = {Real-time Point Cloud Transmission for Immersive Teleoperation of Autonomous Mobile Robots},
  year = {2025},
  isbn = {9798400714672},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  url = {https://doi.org/10.1145/3712676.3719263},
  doi = {10.1145/3712676.3719263},
  booktitle = {Proceedings of the 16th ACM Multimedia Systems Conference},
  pages = {311–316},
  numpages = {6},
  keywords = {teleoperation, mobile robots, VR, point clouds, WebRTC},
  location = {Stellenbosch, South Africa},
  series = {MMSys '25}
}
```

or: 

DIANE: Distributed Immersive Platform for Robot Teleoperation. https://github.com/Diane-Spirit