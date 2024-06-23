import { Grid, IconButton, TextField, Paper, Typography, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React from "react";

export interface OutletParameters {
    index: number,
    c: string,
    q: string,
    r: string,
}

interface OutletProperties extends OutletParameters {
    disabled: boolean[],
    updateValue: (value: string, outletIndex: number, parameterIndex: string) => void,
    deleteOutlet: (outletIndex: number) => void,
}

export default class Inlet extends React.Component<OutletProperties> {
    constructor(props: OutletProperties) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        let strList = event.target.id.split('-');
        this.props.updateValue(event.target.value, Number(strList[1]), strList[2]);
    }

    handleDelete() {
        this.props.deleteOutlet(this.props.index);
    }

    render() {
        return (
            <Paper elevation={3} sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                    <Typography variant="h5" align="center">{this.props.index + 1}.</Typography>
                    <IconButton aria-label="delete" disabled={this.props.disabled[0]} color="primary" onClick={this.handleDelete}>
                        <DeleteIcon />
                    </IconButton>
                    <TextField id={`outlet-${this.props.index}-c`} disabled={this.props.disabled[1]} label="Concentration" type="number" value={this.props.c} onChange={this.handleChange} />
                    <TextField id={`outlet-${this.props.index}-q`} disabled={this.props.disabled[2]} label="Flow Rate" type="number" value={this.props.q} onChange={this.handleChange} />
                    <TextField id={`outlet-${this.props.index}-r`} disabled={this.props.disabled[3]} label="Hydrodynamic Resistance" type="number" value={this.props.r} onChange={this.handleChange} />
                </Stack>
                {/* <Grid container spacing={3} alignItems="center">
                    <Grid item xs={3}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                            <Typography variant="h5" align="center">{this.props.index + 1}.</Typography>
                            <IconButton aria-label="delete" color="primary">
                                <DeleteIcon />
                            </IconButton>
                        </Stack>
                    </Grid>
                    <Grid item xs={3}>
                        <TextField id={`outlet-${this.props.index}-c`} disabled={this.props.disabled[0]} label="Concentration" type="number" value={this.props.c} onChange={this.handleChange} />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField id={`outlet-${this.props.index}-q`} disabled={this.props.disabled[1]} label="Flow Rate" type="number" value={this.props.q} onChange={this.handleChange} />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField id={`outlet-${this.props.index}-r`} disabled={this.props.disabled[2]} label="Hydrodynamic Resistance" type="number" value={this.props.r} onChange={this.handleChange} />
                    </Grid>
                </Grid> */}
            </Paper>
        );
    }
}