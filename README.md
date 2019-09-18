[Marmoset Brain Connectivity Analysis](http://analysis.marmosetbrain.org)
=========================================================

This Marmoset Brain Connectivity Analysis project presents statistical analysis based on the results of injections of monosynaptic retrograde fluorescent tracers injections.

The matrix view presents the weighed and directed connectivity matrix. The complementary graph view presents directional graph of the same dataset.

The SLN matrix presents the fraction of extrinsic supragranular neurons labelled by the tracers.

Installation
------------
The Marmoset Brain Connectivity Analysis portal is based on static HTML codes with compiled Javascript libraries. It is expected to run on any operating systems, however, so far, it has only been tested on Linux.

A working installation of [node.js](https://nodejs.org/) is expected, the package would need npm to install the dependencies and compile the javascripts.

To setup and run the web service
```
cd react
npm install

cd ..
pip install -e .
uwsgi --ini-paste development.ini

npm run webpack&
npm run grunt&
```

Note the npm run will create compiled javascript bundled to be executed by browser. It only need to be executed once and doesn't need the daemon to be kept running. The default setup runs a daemon to keep monitor source file changes and compiles the latest version.

The software expect to run under non-privileged user.

Note: Some libraries needed indirectly by the software stack may need to be installed. A general working command for Ubuntu or Debian based Linux is as follows:

```
sudo apt-get install nodejs npm
```

Licensing and Citation Policy
-----------------------------
This source code is distributed under the term of [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html).
Click [here](http://www.marmosetbrain.org/about) for citation policy page for other components of the Marmoset Brain Connectivity Atlas.

Authors
-------
Click [here](http://www.marmosetbrain.org/about#contributors) for a detailed list of Authors and Contributors of the project.

Sponsors
--------

[![International Neuroinformatics Coordinating Facility Seed Funding Grant](http://www.marmosetbrain.org/static/images/incf_logo.svg)](https://www.incf.org/)
[![Australian Research Council](http://www.marmosetbrain.org/static/images/arc_logo.png)](http://www.arc.gov.au/)
[![Centre of Excellence for Integrative Brain Function](http://www.marmosetbrain.org/static/images/cibf_logo.png)](http://www.cibf.edu.au/discovery)

[![Nencki Insitute of Experimental Biology](http://www.marmosetbrain.org/static/images/nencki_logo.png)](http://en.nencki.gov.pl/laboratory-of-neuroinformatics)
[![Monash University](http://www.marmosetbrain.org/static/images/monash_logo.png)](http://www.monash.edu.au/)
