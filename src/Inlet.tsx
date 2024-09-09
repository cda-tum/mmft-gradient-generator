import { TextField, Paper, Typography, Stack } from '@mui/material';
import React from "react";

export interface InletParameters {
    index: number,
    c: string,
    q: string,
    l: string,
}

interface InletProperties extends InletParameters {
    disabled: boolean[],
    updateValue: (value: string, inletIndex: number, parameterIndex: string) => void,
}

export default class Inlet extends React.Component<InletProperties> {
    constructor(props: InletProperties) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        let strList = event.target.id.split('-');
        this.props.updateValue(event.target.value, Number(strList[1]), strList[2]);
    }

    render() {
        return (
            <Paper elevation={3} sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                    <Typography variant="h5" align="center">{this.props.index + 1}.</Typography>
                    <TextField id={`inlet-${this.props.index}-c`} disabled={this.props.disabled[0]} label="Concentration" type="number" value={this.props.c} onChange={this.handleChange} />
                    <TextField id={`inlet-${this.props.index}-q`} disabled={this.props.disabled[1]} label="Flow Rate" type="number" value={this.props.q} onChange={this.handleChange} />
                    <TextField id={`inlet-${this.props.index}-l`} disabled={this.props.disabled[2]} label="Length" type="number" value={this.props.l} onChange={this.handleChange} />
                </Stack>
                {/* <Grid container spacing={3} alignItems="center">
                    <Grid item xs={3}>
                        <Typography variant="h5" align="center">{this.props.index + 1}.</Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <TextField id={`inlet-${this.props.index}-c`} disabled={this.props.disabled[0]} label="Concentration" type="number" value={this.props.c} onChange={this.handleChange} />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField id={`inlet-${this.props.index}-q`} disabled={this.props.disabled[1]} label="Flow Rate" type="number" value={this.props.q} onChange={this.handleChange} />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField id={`inlet-${this.props.index}-l`} disabled={this.props.disabled[2]} label="Length" type="number" value={this.props.l} onChange={this.handleChange} />
                    </Grid>
                </Grid> */}
            </Paper>
        );
    }
}