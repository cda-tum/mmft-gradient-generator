import { Alert, AlertColor, AppBar, Box, Button, Container, createTheme, Grid, IconButton, Paper, Slider, Stack, TextField, Toolbar, Tooltip, Typography } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';
import { InletParameters } from './Inlet';
import { OutletParameters } from './Outlet';
import { GradientGeneratorCreator } from './gradientGenerator/GradientGeneratorCreator';

// const lightTheme = createTheme({ palette: { mode: 'dark' } });

interface Parameters {
  w: string,
  h: string,
  radius: string,
  wMeanderMax: string,
  mu: string,
  tMin: string,
  straightOutlets: true,
  inlets: InletParameters[],
  outlets: OutletParameters[],
  nOutlets: string,
  alert: { severity: AlertColor, visible: boolean, message: string },
  svg: { viewBox: string, path: string, url: string }
}

export default class App extends React.Component<{}, Parameters> {
  constructor(props: any) {
    super(props);
    this.state = {
      w: '300.0',
      h: '100.0',
      radius: '300.0',
      wMeanderMax: '6000.0',
      mu: '1e-3',
      tMin: '10',
      straightOutlets: true,
      inlets: [{ index: 0, c: '100.00', q: '1e-10', l: '1000' }, { index: 1, c: '0.0', q: '1e-10', l: '1000' }],
      // outlets: [{ index: 0, c: '12.0', q: '', r: '0.0' }, { index: 1, c: '50.0', q: '33', r: '0.0' }, { index: 2, c: '0.0', q: '', r: '0.0' }],
      outlets: [{ index: 0, c: '100.00', q: 'Already determined', r: '0.0' }, { index: 1, c: '50.00', q: '6.67e-11', r: '0.0' }, { index: 2, c: '0.0', q: 'Already determined', r: '0.0' }],
      nOutlets: '3',
      alert: { severity: 'error', visible: false, message: '' },
      svg: { viewBox: '', path: '', url: '' }
    }

    this.updateInletValue = this.updateInletValue.bind(this);
    this.updateOutletValue = this.updateOutletValue.bind(this);
    this.deleteOutlet = this.deleteOutlet.bind(this);
    this.handleNumberOfOutlets = this.handleNumberOfOutlets.bind(this);
    this.handleAddOutlet = this.handleAddOutlet.bind(this);
    this.initializeOutlets = this.initializeOutlets.bind(this);
    this.createGradientGenerator = this.createGradientGenerator.bind(this);
    this.updateParameter = this.updateParameter.bind(this);
  }

  shallowCopy(par: Parameters) {
    return {
      ...par,
      inlets: [...par.inlets],
      outlets: [...par.outlets],
      alert: { ...par.alert },
      svg: { ...par.svg },
    }
  }

  updateParameter(event: React.ChangeEvent<HTMLInputElement>) {
    const strList = event.target.id.split('-');
    const value = event.target.value;

    //check if single parameter or inlet/outlet has to be updated
    if (strList.length === 1) {
      this.updateSingleParameter(strList[0], value);
    } else if (strList.length === 3) {
      if (strList[0] === 'inlet') {
        this.updateInletValue(value, Number(strList[1]), strList[2]);
      } else if (strList[0] === 'outlet') {
        this.updateOutletValue(value, Number(strList[1]), strList[2]);
      }
    }
  }

  updateSingleParameter(id: string, value: string) {
    let oldState = this.shallowCopy(this.state);

    if (id === 'width') {
      oldState.w = value;
    } else if (id === 'height') {
      oldState.h = value;
    } else if (id === 'wMeanderMax') {
      oldState.wMeanderMax = value;
    } else if (id === 'radius') {
      oldState.radius = value;
    } else if (id === 'mu') {
      oldState.mu = value;
    } else if (id === 'tMin') {
      oldState.tMin = value;
    } else if (id === 'nOutlets') {
      oldState.nOutlets = value;
    } else {
      //wrong id => no update needed
      return;
    }

    this.setState(oldState);
  }

  updateInletValue(value: string, inletIndex: number, parameterIndex: string) {
    let oldState = this.shallowCopy(this.state);
    if (parameterIndex === 'c') {
      oldState.inlets[inletIndex].c = value;
      if (inletIndex === 0) {
        oldState.outlets[0].c = value;
      } else if (inletIndex === 1) {
        oldState.outlets[oldState.outlets.length - 1].c = value;
      }
    } else if (parameterIndex === 'q') {
      oldState.inlets[inletIndex].q = value;
    } else if (parameterIndex === 'l') {
      oldState.inlets[inletIndex].l = value;
    }

    this.setState(oldState);
  }

  updateOutletValue(value: string, outletIndex: number, parameterIndex: string) {
    let oldState = this.shallowCopy(this.state);
    if (parameterIndex === 'c') {
      oldState.outlets[outletIndex].c = value;
    } else if (parameterIndex === 'q') {
      oldState.outlets[outletIndex].q = value;
    } else if (parameterIndex === 'r') {
      oldState.outlets[outletIndex].r = value;
    }

    this.setState(oldState);
  }

  deleteOutlet(outletIndex: number) {
    //only remove outlet when more than 3 outlets are present
    const nOutlets = this.state.outlets.length;
    if (nOutlets > 3) {
      //do not remove first and last outlet
      if (0 < outletIndex && outletIndex < nOutlets - 1) {
        let oldState = this.shallowCopy(this.state);
        oldState.outlets.splice(outletIndex, 1);

        //set index correctly
        for (let index = 0; index < oldState.outlets.length; index++) {
          oldState.outlets[index].index = index;
        }

        //set state
        this.setState(oldState);
      }
    }
  }

  handleAddOutlet(index: number) {
    let oldState = this.shallowCopy(this.state);

    let newC = (Number(oldState.outlets[index - 1].c) + Number(oldState.outlets[index].c)) / 2;
    let newQ = (Number(oldState.outlets[index - 1].q) + Number(oldState.outlets[index].q)) / 2;

    if (isNaN(newC)) {
      newC = 0.0;
    }
    if (isNaN(newQ)) {
      newQ = 0.0;
    }

    oldState.outlets.splice(index, 0, { index: index + 1, c: newC.toFixed(2), q: newQ.toExponential(2), r: '0.0' })

    //set index correctly
    for (let index = 0; index < oldState.outlets.length; index++) {
      oldState.outlets[index].index = index;
    }

    //set state
    this.setState(oldState);
  }

  handleNumberOfOutlets(event: React.ChangeEvent<HTMLInputElement>) {
    let value = event.target.value;

    let oldState = this.shallowCopy(this.state);
    let tempNumberValue = Number(value);
    if (value !== '' && !isNaN(tempNumberValue)) {
      if (tempNumberValue < 3) {
        value = '3';
      }
    }
    oldState.nOutlets = value;

    this.setState(oldState);
  }

  initializeOutlets() {
    let nOutlets = Number(this.state.nOutlets) < 3 ? 3 : Number(this.state.nOutlets);
    const cInlet0 = isNaN(Number(this.state.inlets[0].c)) ? 100.0 : Number(this.state.inlets[0].c);
    const cInlet1 = isNaN(Number(this.state.inlets[1].c)) ? 0.0 : Number(this.state.inlets[1].c);
    const qInlet0 = isNaN(Number(this.state.inlets[0].q)) ? 0.0 : Number(this.state.inlets[0].q);
    const qInlet1 = isNaN(Number(this.state.inlets[1].q)) ? 0.0 : Number(this.state.inlets[1].q);

    let oldState = this.shallowCopy(this.state);

    oldState.outlets = [];
    for (let iOutlet = 0; iOutlet < nOutlets; iOutlet++) {
      const cOutlet = cInlet0 - (cInlet0 - cInlet1) * iOutlet / (nOutlets - 1);
      const qOutlet = (qInlet0 + qInlet1) / nOutlets;

      if (iOutlet === 0 || iOutlet === nOutlets - 1) {
        oldState.outlets.push({ index: iOutlet, c: cOutlet.toFixed(2), q: 'Already determined', r: '0.0' });
      } else {
        oldState.outlets.push({ index: iOutlet, c: cOutlet.toFixed(2), q: qOutlet.toExponential(2), r: '0.0' });
      }
    }

    this.setState(oldState);
  }

  private static parseNumber(text: string) {
    //check if text is not an empty string (otherwise 0 would be returned)
    if (text) {
      return Number(text);
    }

    return NaN;
  }

  setAlert(isError: boolean, message: string) {
    let oldState = this.shallowCopy(this.state);
    if (isError) {
      oldState.alert.severity = "error";
    } else {
      oldState.alert.severity = "success";
    }

    oldState.alert.message = message;
    oldState.alert.visible = true;

    this.setState(oldState);
  }

  createGradientGenerator() {
    const ggc = new GradientGeneratorCreator();

    //set parameters
    ggc.w = App.parseNumber(this.state.w) * 1e-6;
    ggc.h = App.parseNumber(this.state.h) * 1e-6;
    ggc.wMeanderMax = App.parseNumber(this.state.wMeanderMax) * 1e-6;
    ggc.radius = App.parseNumber(this.state.radius) * 1e-6;
    ggc.mu = App.parseNumber(this.state.mu);
    ggc.tMin = App.parseNumber(this.state.tMin);
    //inlets
    for (let iInlet = 0; iInlet < this.state.inlets.length; iInlet++) {
      const inlet = this.state.inlets[iInlet];
      ggc.inlets.push({ c: App.parseNumber(inlet.c) * 1e-2, q: App.parseNumber(inlet.q), l: App.parseNumber(inlet.l) * 1e-6 });
    }
    //outlets
    for (let iOutlet = 0; iOutlet < this.state.outlets.length; iOutlet++) {
      const outlet = this.state.outlets[iOutlet];
      ggc.outlets.push({ c: App.parseNumber(outlet.c) * 1e-2, q: App.parseNumber(outlet.q), r: App.parseNumber(outlet.r) });
    }

    //check parameters
    let valid = ggc.areParametersValid();

    //set alert and return if not valid
    let oldState = this.shallowCopy(this.state);
    if (valid) {
      oldState.alert.severity = "success";
    } else {
      oldState.alert.severity = "error";
    }
    oldState.alert.message = ggc.error.message;
    oldState.alert.visible = true;
    if (!valid) {
      this.setState(oldState);
      return;
    }

    //create gradient generator
    valid = ggc.createGradientGenerator();

    //set alert and return if not valid
    if (valid) {
      oldState.alert.severity = "success";
    } else {
      oldState.alert.severity = "error";
    }
    oldState.alert.message = ggc.error.message;
    oldState.alert.visible = true;
    if (!valid) {
      this.setState(oldState);
      return;
    }

    //create svg
    const svgPath = ggc.createSVGPath();
    if (svgPath) {
      oldState.svg.path = svgPath;
      const wTotal = ggc.getTotalWidth();
      const hTotal = ggc.getTotalHeight();
      // oldState.svg.viewBox = `${-wTotal/2*1e6} 0 ${wTotal*1e6} ${hTotal*1e6}`;
      oldState.svg.viewBox = `${-wTotal / 2} 0 ${wTotal} ${hTotal}`;

      //prepare download
      let svgFile = `<svg version="1.1"
      viewBox="${-wTotal / 2} 0 ${wTotal} ${hTotal}"
      preserveAspectRatio="xMidYMid meet"
      baseProfile="full"
      xmlns="http://www.w3.org/2000/svg">

      <path fill-rule="evenodd" transform="scale(1 -1)" d="${svgPath}"></path>
    </svg>`
      oldState.svg.url = URL.createObjectURL(new Blob([svgFile]));
      this.setState(oldState);
    }

  }

  render() {
    return (
      <div className="App">
        <AppBar position="sticky" color="default">
          <Toolbar>
            <Typography variant="h6" color="inherit" noWrap>
              Chair for Design Automation - Technical University of Munich
            </Typography>
          </Toolbar>
        </AppBar>

        <Container component="main">
          <Typography component="h1" variant="h2" align="center" sx={{ p: 2 }}>
            Gradient Generator
          </Typography>

          <Typography variant="h5" align="left">Geometrical Parameters</Typography>
          <Grid container spacing={3} sx={{ p: 2 }}>
            <Grid item xs={12} sm={6}>
              <Tooltip title='w: With of all channels in µm. The inequality "0 < w" must hold.'>
                <TextField id="width" label="Channel Width in µm (w)" type="number" fullWidth value={this.state.w} onChange={this.updateParameter} />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* <Tooltip title='h: Height of all channels in µm. The inequality "0 < h <= w" must hold.'> */}
              <Tooltip title={<div>h: Height of all channels in µm.<br />The inequality "0 &lt; h &lt;= w" must hold.</div>}>
                <TextField id="height" label="Channel Height in µm (h)" type="number" fullWidth value={this.state.h} onChange={this.updateParameter} />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title='r: Radius of all meanders in µm. The inequalities "w <= r" must hold.'>
                <TextField id="radius" label="Meander Radius in µm (r)" type="number" fullWidth value={this.state.radius} onChange={this.updateParameter} />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title='wMeanderMax: Maximal width of the area a meander occupies in µm. The inequality "5*w + 8*r < wMeanderMax" must hold.'>
                <TextField id="wMeanderMax" label="Maximal Meander width in µm (wMeanderMax)" type="number" fullWidth value={this.state.wMeanderMax} onChange={this.updateParameter} />
              </Tooltip>
            </Grid>
          </Grid>

          <Typography variant="h5" align="left">Fluid Parameters</Typography>
          <Grid container spacing={3} sx={{ p: 2 }}>
            <Grid item xs={12} sm={6}>
              <Tooltip title='µ: Viscosity of the used fluid.'>
                <TextField id="mu" label="Viscosity of Fluids in Pa*s (µ)" type="number" fullWidth value={this.state.mu} onChange={this.updateParameter} />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title='tMin: Minimal time two fluids need to flow inside a meander channel in order to fully mix. Affects the length of the channels.'>
                <TextField id="tMin" label="Minimal Mixing Time in s (tMin)" type="number" fullWidth value={this.state.tMin} onChange={this.updateParameter} />
              </Tooltip>
            </Grid>
          </Grid>

          <Typography variant="h5" align="left">Inlets</Typography>
          <Stack spacing={2} sx={{ p: 2 }}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                <Typography variant="h5" align="center">1.</Typography>
                <Tooltip title='cInlet1: Concentration of the fluid entering the 1.Inlet. The two inequalities "0 <= cInlet1 <= 100" and "cInlet1 > cInlet2" must hold.'>
                  <TextField id={`inlet-0-c`} label="Concentration in % (cInlet1)" type="number" value={this.state.inlets[0].c} onChange={this.updateParameter} />
                </Tooltip>
                <Tooltip title='qInlet1: Flow rate of the fluid entering the 1.Inlet. The inequality "0 < qInlet1" must hold.'>
                  <TextField id={`inlet-0-q`} label="Flow Rate in m^3/s (qInlet1)" type="number" value={this.state.inlets[0].q} onChange={this.updateParameter} />
                </Tooltip>
                <Tooltip title='lInlet1: Length of the 1.Inlet. The inequality "0 < lInlet1" must hold.'>
                  <TextField id={`inlet-0-l`} label="Length in µm (lInlet1)" type="number" value={this.state.inlets[0].l} onChange={this.updateParameter} />
                </Tooltip>
              </Stack>
            </Paper>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                <Typography variant="h5" align="center">2.</Typography>
                <Tooltip title='cInlet2: Concentration of the fluid entering the 2.Inlet. The two inequalities "0 <= cInlet2 <= 100" and "cInlet1 > cInlet2" must hold.'>
                  <TextField id={`inlet-1-c`} label="Concentration in % (cInlet2)" type="number" value={this.state.inlets[1].c} onChange={this.updateParameter} />
                </Tooltip>
                <Tooltip title='qInlet2: Flow rate of the fluid entering the 2.Inlet. The inequality "0 < qInlet2" must hold.'>
                  <TextField id={`inlet-1-q`} label="Flow Rate in m^3/s (qInlet2)" type="number" value={this.state.inlets[1].q} onChange={this.updateParameter} />
                </Tooltip>
                <Tooltip title='lInlet2: Length of the 2.Inlet. The inequality "0 < lInlet2" must hold.'>
                  <TextField id={`inlet-1-l`} label="Length in µm (lInlet2)" type="number" value={this.state.inlets[1].l} onChange={this.updateParameter} />
                </Tooltip>
              </Stack>
            </Paper>
          </Stack>

          <Typography variant="h5" align="left">Outlets</Typography>
          <Stack spacing={2} direction="row" alignItems="center" justifyContent="left" sx={{ p: 2 }}>
            <Tooltip title='nOutlets: Number of outlets that should be initialized. The inequality "3 <= nOutlets" must hold.'>
              <TextField id="nOutlets" label="Number of Outlets (nOutlets)" type="number" value={this.state.nOutlets} onChange={this.updateParameter} />
            </Tooltip>
            <Button variant="contained" color="primary" onClick={this.initializeOutlets}>
              Initialize Outlets
            </Button>
          </Stack>
          <Stack spacing={2} sx={{ p: 2 }}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                <Typography variant="h5" align="center">1.</Typography>
                <IconButton aria-label="delete" disabled color="primary">
                  <DeleteIcon />
                </IconButton>
                <Tooltip title='cOutlet1: Concentration of the fluid exiting the 1.Outlet. This value is always equal to cInlet1 and cannot be changed.'>
                  <TextField id={`outlet-0-c`} label="Concentration in % (cOutlet1)" disabled type="number" value={this.state.inlets[0].c} />
                </Tooltip>
                <Tooltip title='qOutlet1: Flow rate of the fluid exiting the 1.Outlet. This value is already determined due to physical dependencies with the inlet and outlet flow rates.'>
                  <TextField id={`outlet-0-q`} label="Flow Rate in m^3/s (qOutlet1)" disabled value={this.state.outlets[0].q} />
                </Tooltip>
                <Tooltip title='rOutlet1: Additional hydrodynamic resistance of the 1.Outlet. Useful when channels or other components are appended to the outlet.'>
                  <TextField id={`outlet-0-r`} label="Hydrodynamic Resistance in ? (rOutlet1)" type="number" value={this.state.outlets[0].r} onChange={this.updateParameter} />
                </Tooltip>
              </Stack>
            </Paper>

            {
              this.state.outlets.filter((outlet) => (outlet.index !== 0 && outlet.index !== this.state.outlets.length - 1)).map((outlet) => {
                const nOutlets = this.state.outlets.length;
                const visibleIndex = outlet.index + 1;
                const disableDeleteButton = nOutlets <= 3;

                return (
                  <React.Fragment>
                    <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => this.handleAddOutlet(outlet.index)} >
                      Add Outlet
                    </Button>
                    <Paper elevation={3} sx={{ p: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <Typography variant="h5" align="center">{outlet.index + 1}.</Typography>
                        <IconButton aria-label="delete" disabled={disableDeleteButton} color="primary" onClick={() => this.deleteOutlet(outlet.index)}>
                          <DeleteIcon />
                        </IconButton>
                        <Tooltip title={`cOutlet${visibleIndex}: Concentration of the fluid exiting the ${visibleIndex}.Outlet. The inequality "cOutlet${visibleIndex - 1} > cOutlet${visibleIndex} > cOutlet${visibleIndex + 1}" must hold.`}>
                          <TextField id={`outlet-${outlet.index}-c`} label={`Concentration in % (cOutlet${visibleIndex})`} type="number" value={this.state.outlets[outlet.index].c} onChange={this.updateParameter} />
                        </Tooltip>
                        <Tooltip title={`qOutlet${visibleIndex}: Flow rate of the fluid exiting the ${visibleIndex}.Outlet. The sum of all outlet flow rates must not exceed the sum of all inlet flow rates, hence the inequality "sum(qInlet[i]) > sum(qOutlet[i])" must hold.`}>
                          <TextField id={`outlet-${outlet.index}-q`} label={`Flow Rate in m^3/s (qOutlet${visibleIndex})`} type="number" value={this.state.outlets[outlet.index].q} onChange={this.updateParameter} />
                        </Tooltip>
                        <Tooltip title={`rOutlet${visibleIndex}: Additional hydrodynamic resistance of the ${visibleIndex}.Outlet. Useful when channels or other components are appended to the outlet.`}>
                          <TextField id={`outlet-${outlet.index}-r`} label={`Hydrodynamic Resistance in ? (rOutlet${visibleIndex})`} type="number" value={this.state.outlets[outlet.index].r} onChange={this.updateParameter} />
                        </Tooltip>
                      </Stack>
                    </Paper>
                  </React.Fragment>
                );
              })
            }

            <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => this.handleAddOutlet(this.state.outlets.length - 1)} >
              Add Outlet
            </Button>

            <Paper elevation={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                <Typography variant="h5" align="center">{this.state.outlets.length}.</Typography>
                <IconButton aria-label="delete" disabled color="primary">
                  <DeleteIcon />
                </IconButton>
                <Tooltip title={`cOutlet${this.state.outlets.length}: Concentration of the fluid exiting the ${this.state.outlets.length}.Outlet. This value is always equal to cInlet2 and cannot be changed.`}>
                  <TextField id={`outlet-${this.state.outlets.length - 1}-c`} disabled label={`Concentration in % (cOutlet${this.state.outlets.length})`} type="number" value={this.state.inlets[1].c} />
                </Tooltip>
                <Tooltip title={`qOutlet${this.state.outlets.length}: Flow rate of the fluid exiting the ${this.state.outlets.length}.Outlet. This value is already determined due to physical dependencies with the inlet and outlet flow rates.`}>
                  <TextField id={`outlet-${this.state.outlets.length - 1}-q`} disabled label={`Flow Rate in m^3/s (qOutlet${this.state.outlets.length})`} value={this.state.outlets[this.state.outlets.length - 1].q} />
                </Tooltip>
                <Tooltip title={`rOutlet${this.state.outlets.length}: Additional hydrodynamic resistance of the ${this.state.outlets.length}.Outlet. Useful when channels or other components are appended to the outlet.`}>
                  <TextField id={`outlet-${this.state.outlets.length - 1}-r`} label={`Hydrodynamic Resistance in ? (rOutlet${this.state.outlets.length})`} type="number" value={this.state.outlets[this.state.outlets.length - 1].r} onChange={this.updateParameter} />
                </Tooltip>
              </Stack>
            </Paper>
            {/* {
              <Paper elevation={3} sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                  <Typography variant="h5" align="center">{this.state.outlets.length}.</Typography>
                  <IconButton aria-label="delete" disabled color="primary">
                    <DeleteIcon />
                  </IconButton>
                  <Tooltip title='cOutlet1: Concentration of the fluid exiting the 1.Outlet. This value is always equal to cInlet1 and cannot be changed.'>
                    <TextField id={`outlet-0-c`} label="Concentration in % (cOutlet1)" disabled type="number" value={this.state.inlets[0].c} />
                  </Tooltip>
                  <Tooltip title='qOutlet1: Flow rate of the fluid exiting the 1.Outlet. This value is already determined due to physical dependencies with the inlet and outlet flow rates.'>
                    <TextField id={`outlet-0-q`} label="Flow Rate in m^3/s (qOutlet1)" disabled value={this.state.outlets[0].q} />
                  </Tooltip>
                  <Tooltip title='rOutlet1: Additional hydrodynamic resistance of the 1.Outlet. Useful when channels or other components are appended to the outlet.'>
                    <TextField id={`outlet-0-r`} label="Hydrodynamic Resistance in ? (rOutlet1)" type="number" value={this.state.outlets[0].r} onChange={this.updateParameter} />
                  </Tooltip>
                </Stack>
              </Paper>
            } */}

            {/* 
            {
              this.state.outlets.map((outlet) => {
                if (outlet.index === 0) {
                  return (
                    <Outlet index={outlet.index} c={this.state.inlets[0].c} q={outlet.q} r={outlet.r} disabled={[true, true, true, false]} updateValue={this.updateOutletValue} deleteOutlet={this.deleteOutlet} />
                  );
                } else if (outlet.index === this.state.outlets.length - 1) {
                  return (
                    <React.Fragment>
                      <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => this.handleAddOutlet(outlet.index)} >
                        Add Outlet
                      </Button>
                      <Outlet index={outlet.index} c={this.state.inlets[1].c} q={outlet.q} r={outlet.r} disabled={[true, true, true, false]} updateValue={this.updateOutletValue} deleteOutlet={this.deleteOutlet} />
                    </React.Fragment>
                  );
                } else {
                  const disabled = this.state.outlets.length > 3 ? [false, false, false, false] : [true, false, false, false];
                  return (
                    <React.Fragment>
                      <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => this.handleAddOutlet(outlet.index)} >
                        Add Outlet
                      </Button>
                      <Outlet index={outlet.index} c={outlet.c} q={outlet.q} r={outlet.r} disabled={disabled} updateValue={this.updateOutletValue} deleteOutlet={this.deleteOutlet} />
                    </React.Fragment>
                  );
                }
              })
            } */}
          </Stack>

          <Typography variant="h5" align="left">Gradient Generator</Typography>
          <Stack spacing={2} direction="row" alignItems="center" justifyContent="center" sx={{ p: 2 }}>
            <Button variant="contained" color="primary" onClick={this.createGradientGenerator}>
              Create Gradient Generator
            </Button>
            <Button variant="contained" color="primary" href={this.state.svg.url} download="GradientGenerator.svg">
              Download SVG
            </Button>
          </Stack>

          {
            this.state.alert.visible && <Alert severity={this.state.alert.severity}>{this.state.alert.message}</Alert>
          }

          <Box sx={{ p: 2, m: 2, border: '1px black solid' }}>
            {
              this.state.svg.path !== '' &&
              <svg version="1.1"
                // width="600"
                // height="600"
                viewBox={this.state.svg.viewBox}
                // viewBox="-200 200 0 600"
                preserveAspectRatio="xMidYMid meet"
                baseProfile="full"
                xmlns="http://www.w3.org/2000/svg">

                {/* <path fill-rule="evenodd" transform="scale(3779.5 -3779.5)" d={this.state.svg.path}></path> */}
                <path fill-rule="evenodd" transform="scale(1 -1)" d={this.state.svg.path}></path>
              </svg>
            }
          </Box>
        </Container>
        <Container>
          <Typography variant="body1" align="left">
            In case of questions/problems, please contact us through <a href="mailto:microfluidics.cda@xcit.tum.de">microfluidics.cda@xcit.tum.de</a>.
          </Typography>
        </Container>
      </div>
    )
  }
}
