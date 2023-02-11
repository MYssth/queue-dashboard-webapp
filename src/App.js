import * as React from 'react';
import { useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import {
  Paper,
  Grid,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';

let HNTimer = [];

export default function App() {

  const [curDate, setCurDate] = useState('');
  const [curTime, setCurTime] = useState('');

  const [HNStatus, setHNStatus] = useState([]);

  useEffect(() => {

    const interval = setInterval(() => {
      updateTime();
    }, 1000);
    const interval2 = setInterval(() => {
      refreshData();
    }, 20000);
    refreshData();
    return () => {
      clearInterval(interval);
      clearInterval(interval2)
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateTime() {
    const date = new Date();
    setCurDate(date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
    setCurTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, }));
  }

  function refreshData() {

    fetch(`http://${process.env.REACT_APP_host}:${process.env.REACT_APP_QDSPort}/api/qds/gethnstatus`)
      .then((response) => response.json())
      .then((data) => {
        addHNTimer(data);
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          console.log("cancelled")
        }
        else {
          console.error('Error:', error);
        }
      });
  }

  async function addHNTimer(newData) {

    let tempHNTimer = [];
    const date = new Date();

    if (HNTimer.length !== 0) {
      for (let i = 0; i < newData.length; i += 1) {
        for (let l = 0; l < HNTimer.length; l += 1) {
          if (newData[i].VNSEQ === HNTimer[l].VNSEQ) {
            tempHNTimer.push({
              VNSEQ: newData[i].VNSEQ,
              STATUS: newData[i].STATUS,
              TIME: await HNTimer[l].STATUS === newData[i].STATUS ? HNTimer[l].TIME : date.toLocaleString(),
              WAIT_TIME: await HNTimer[l].STATUS === newData[i].STATUS ? "" + new Date(date.getTime() - new Date(HNTimer[l].TIME).getTime() - 24100000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, }) : "00:00",
            });
            break;
          }
          else if (l === HNTimer.length - 1) {
            tempHNTimer.push({
              VNSEQ: newData[i].VNSEQ,
              STATUS: newData[i].STATUS,
              TIME: date.toLocaleString(),
              WAIT_TIME: "00:00",
            });
          }

        }
      }
    }
    else {
      for (let i = 0; i < newData.length; i += 1) {
        tempHNTimer.push({
          VNSEQ: newData[i].VNSEQ,
          STATUS: newData[i].STATUS,
          TIME: date.toLocaleString(),
          WAIT_TIME: "00:00",
        });
      }
    }
    HNTimer = tempHNTimer;
    await setHNStatus(newData);

  }

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="lg">

        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h4" gutterBottom>
                Dashboard
              </Typography>
            </Grid>
            <Grid item xs={8}>

            </Grid>
            <Grid item xs={4} align='right'>
              {`วันที่ ${curDate} ${curTime} น.`}
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>HN</TableCell>
                      <TableCell>หน่วยงาน</TableCell>
                      <TableCell>ลงทะเบียน</TableCell>
                      <TableCell>ซักประวัติ</TableCell>
                      <TableCell>พบแพทย์</TableCell>
                      <TableCell>รอผลตรวจ</TableCell>
                      <TableCell>ชำระเงิน</TableCell>
                      <TableCell>รับยา</TableCell>
                      <TableCell>กลับบ้าน</TableCell>
                      <TableCell>เวลาคอย</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {HNStatus.map((row) => (
                      <TableRow
                        key={row.VNSEQ}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell>{row.HN}</TableCell>
                        <TableCell>{row.DIVISION}</TableCell>
                        <TableCell>{row.TIME}</TableCell>
                        <TableCell align='center' >{row.STATUS === "ลงทะเบียน" ? "X" : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "รอพบแพทย์" ? "X" : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "รอผล" ? "X" : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "จบการรักษา" ? "X" : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "ชำระเงิน" ? "X" : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "จ่ายยา" || row.STATUS === "ชำระเงิน(คนไข้ไม่มียา)" ? "X" : ""}</TableCell>
                        <TableCell>{HNTimer?.find(o => o.VNSEQ === row.VNSEQ)?.WAIT_TIME} นาที</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

            </Grid>
          </Grid>
        </Box>
      </Container>
    </React.Fragment>
  );
}
