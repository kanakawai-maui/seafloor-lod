Seafloor LOD Terrain
====================

Seafloor LOD Terrain is a parametric seafloor terrain designed for underwater simulations. It is inspired by the original [LOD Terrain project](http://felixpalmer.github.io/lod-terrain).

![](https://github.com/kanakawai-maui/seafloor-lod/raw/master/screenshots/screenshot1.png)
![](https://github.com/kanakawai-maui/seafloor-lod/raw/master/screenshots/screenshot2.png)
===========

LOD Terrain is an example of how to render a terrain with a variable level of detail (LOD), based on the distance from the camera. The approach taken is based on [CD-LOD](http://www.vertexasylum.com/downloads/cdlod/cdlod_latest.pdf). 

![](https://github.com/kanakawai-maui/seafloor-lod/raw/master/screenshots/screenshot3.png)

Running
=======
To run the project, ensure you have [Node.js](https://nodejs.org/) installed. Then, follow these steps:

1. Install dependencies:
    ```bash
    npm install
    ```

2. Start the development server:
    ```bash
    npm run dev
    ```

3. Open your browser and navigate to the URL provided by Vite, typically `http://localhost:5173`.

For production builds, use:
```bash
npm run build
```

This will generate the optimized output in the `dist` directory.

