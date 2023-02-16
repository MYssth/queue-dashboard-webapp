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
  Stack,
  TextField,
  Button,
} from '@mui/material';

let HNStatus = [];
let filterHNStatus = [];
let tableState = "showAll";
let findHN = "";

let showHistoryTake = true;
let showSeeDoctor = true;
let showWaitResult = true;
let showMakePay = true;
let showGetMed = true;
let showFinished = true;

export default function App() {

  const [curDate, setCurDate] = useState('');
  const [curTime, setCurTime] = useState('');

  useEffect(() => {

    const interval = setInterval(() => {
      updateTime();
    }, 1000);
    const interval2 = setInterval(() => {
      refreshData();
    }, 5000);
    refreshData();
    return () => {
      clearInterval(interval);
      clearInterval(interval2)
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateTime() {
    const date = new Date();
    setCurDate(date.toLocaleDateString('en-gb', {
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
        addHNStatus(data);
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

  async function addHNStatus(newData) {

    let tempHNStatus = [];

    for (let i = 0; i < newData.length; i += 1) {

      // ==== check for duplicate data ====

      let notDup = true;
      for (let l = 0; l < tempHNStatus.length; l += 1) {
        if (newData[i].VNSEQ === tempHNStatus[l].VNSEQ) {
          notDup = false;
          break;
        }
      }

      // ==================================
      if (notDup) {
        if (newData[i].STATUS !== "จ่ายยา" && newData[i].STATUS !== "ชำระเงิน(คนไข้ไม่มียา)") {
          tempHNStatus.push({
            HN: newData[i].HN,
            DIVISION: newData[i].DIVISION,
            REG_TIME: ("0" + newData[i].TIME).slice(-5),
            VNSEQ: newData[i].VNSEQ,
            STATUS: newData[i].STATUS,
            WAIT_TIME: newData[i].EVENTTIM,
            FIN_FLAG: 0,
          });
        }
        else {
          for (let l = 0; l < HNStatus.length; l += 1) {
            if (HNStatus[l].VNSEQ === newData[i].VNSEQ) {
              if (HNStatus[l].FIN_FLAG < 4) {
                tempHNStatus.push({
                  HN: newData[i].HN,
                  DIVISION: newData[i].DIVISION,
                  REG_TIME: ("0" + newData[i].TIME).slice(-5),
                  VNSEQ: newData[i].VNSEQ,
                  STATUS: newData[i].STATUS,
                  WAIT_TIME: newData[i].EVENTTIM,
                  FIN_FLAG: HNStatus[l].FIN_FLAG + 1,
                });
              }
              break;
            }
          }
        }
      }
    }

    HNStatus = [];
    HNStatus = tempHNStatus;
    await setFilterHNStatus();

  }

  async function setFilterHNStatus() {

    filterHNStatus = [];

    if (tableState === "showAll") {
      filterHNStatus = HNStatus;
    }
    else if (tableState === "findHN") {
      filterHNStatus = HNStatus.filter(dt => (dt.HN).includes(findHN));
    }

    if (!showHistoryTake) {
      filterHNStatus = filterHNStatus.filter(dt => dt.STATUS !== "ลงทะเบียน");
    }
    if (!showSeeDoctor) {
      filterHNStatus = filterHNStatus.filter(dt => dt.STATUS !== "รอพบแพทย์");
    }
    if (!showWaitResult) {
      filterHNStatus = filterHNStatus.filter(dt => dt.STATUS !== "รอผล");
    }
    if (!showMakePay) {
      filterHNStatus = filterHNStatus.filter(dt => dt.STATUS !== "จบการรักษา");
    }
    if (!showGetMed) {
      filterHNStatus = filterHNStatus.filter(dt => dt.STATUS !== "ชำระเงิน");
    }
    if (!showFinished) {
      filterHNStatus = filterHNStatus.filter(dt => dt.STATUS !== "จ่ายยา" || dt.STATUS === "ชำระเงิน(คนไข้ไม่มียา)");
    }

  }

  const handleFindHN = () => {
    tableState = "findHN";
    findHN = document.getElementById('HNCode').value;
    setFilterHNStatus();
  };

  const handleShowAll = () => {
    tableState = "showAll";
    findHN = "";
    document.getElementById("HNCode").value = '';
    showHistoryTake = true;
    showSeeDoctor = true;
    showWaitResult = true;
    showMakePay = true;
    showGetMed = true;
    showFinished = true;
    setFilterHNStatus();
  }

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="lg">

        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              <img width="300" src={`${process.env.PUBLIC_URL}/img/logo.png`} alt="logo" />
            </Grid>
            <Grid item xs={4} align='right' sx={{ display: 'flex', alignItems: 'end', justifyContent: 'flex-end', }}>
              <Stack>
                <Typography variant="h4" gutterBottom sx={{ color: '#226d23', fontWeight: 1000 }} >
                  Patient Status
                </Typography>
                <Typography gutterBottom sx={{ color: '#285094' }} >
                  {`${curDate} ${curTime}`}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={8}>
              <Stack direction="row" spacing={1}>
                <TextField id="HNCode" name="HNCode" label="HN code" size='small' />
                <Button variant="contained" sx={{ width: 100 }} onClick={handleFindHN} >ค้นหา</Button>
                <Button variant="contained" sx={{ width: 120 }} onClick={handleShowAll} >แสดงทั้งหมด</Button>
              </Stack>
            </Grid>
            <Grid item xs={4}>

            </Grid>
            <Grid item xs={12} >
              <TableContainer component={Paper} style={{ overflowX: "initial" }}>
                <Table stickyHeader sx={{ minWidth: 650 }} aria-label="sticky table" >
                  <TableHead>
                    <TableRow>
                      <TableCell align='center' ><img width="76" src={`${process.env.PUBLIC_URL}/img/table_hn.jpg`} alt="HN" /></TableCell>
                      <TableCell align='center' ><img width="76" src={`${process.env.PUBLIC_URL}/img/table_division.jpg`} alt="หน่วยงาน" /></TableCell>
                      <TableCell align='center' ><img width="76" src={`${process.env.PUBLIC_URL}/img/table_register.jpg`} alt="ลงทะเบียน" /></TableCell>
                      <TableCell align='center' ><img width="76" src={`${process.env.PUBLIC_URL}/img/table_historytake.jpg`} alt="ซักประวัติ" onClick={() => { showHistoryTake = !showHistoryTake; setFilterHNStatus(); }} style={{ filter: showHistoryTake ? "" : "grayscale(100%)" }} /></TableCell>
                      <TableCell align='center' ><img width="76" src={`${process.env.PUBLIC_URL}/img/table_seedoctor.jpg`} alt="พบแพทย์" onClick={() => { showSeeDoctor = !showSeeDoctor; setFilterHNStatus(); }} style={{ filter: showSeeDoctor ? "" : "grayscale(100%)" }} /></TableCell>
                      <TableCell align='center' ><img width="76" src={`${process.env.PUBLIC_URL}/img/table_waitresult.jpg`} alt="รอผลตรวจ" onClick={() => { showWaitResult = !showWaitResult; setFilterHNStatus(); }} style={{ filter: showWaitResult ? "" : "grayscale(100%)" }} /></TableCell>
                      <TableCell align='center' ><img width="76" src={`${process.env.PUBLIC_URL}/img/table_makepay.jpg`} alt="ชำระเงิน" onClick={() => { showMakePay = !showMakePay; setFilterHNStatus(); }} style={{ filter: showMakePay ? "" : "grayscale(100%)" }} /></TableCell>
                      <TableCell align='center' ><img width="76" src={`${process.env.PUBLIC_URL}/img/table_getmed.jpg`} alt="รับยา" onClick={() => { showGetMed = !showGetMed; setFilterHNStatus(); }} style={{ filter: showGetMed ? "" : "grayscale(100%)" }} /></TableCell>
                      <TableCell align='center' ><img width="76" src={`${process.env.PUBLIC_URL}/img/table_finished.jpg`} alt="กลับบ้าน" onClick={() => { showFinished = !showFinished; setFilterHNStatus(); }} style={{ filter: showFinished ? "" : "grayscale(100%)" }} /></TableCell>
                      <TableCell><img width="76" src={`${process.env.PUBLIC_URL}/img/table_waittime.jpg`} alt="เวลาคอย" /></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody sx={{ '& tr:nth-of-type(odd)': { backgroundColor: 'grey.300', }, }}>
                    {filterHNStatus.map((row) => (
                      <TableRow
                        key={row.VNSEQ}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell><Typography style={{ fontWeight: 1000 }} sx={{ color: '#285094' }} >{row.HN}</Typography></TableCell>
                        <TableCell align='center' ><Typography sx={{ color: '#285094' }} >{row.DIVISION}</Typography></TableCell>
                        <TableCell align='center' ><Typography sx={{ color: '#285094' }} >{`${row.REG_TIME}`}</Typography></TableCell>
                        <TableCell align='center' >{row.STATUS === "ลงทะเบียน" ? <img width="26" src={`${process.env.PUBLIC_URL}/img/Green_dot.svg`} alt="กลับบ้าน" /> : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "รอพบแพทย์" ? <img width="26" src={`${process.env.PUBLIC_URL}/img/Green_dot.svg`} alt="กลับบ้าน" /> : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "รอผล" ? <img width="26" src={`${process.env.PUBLIC_URL}/img/Green_dot.svg`} alt="กลับบ้าน" /> : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "จบการรักษา" ? <img width="26" src={`${process.env.PUBLIC_URL}/img/Green_dot.svg`} alt="กลับบ้าน" /> : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "ชำระเงิน" ? <img width="26" src={`${process.env.PUBLIC_URL}/img/Green_dot.svg`} alt="กลับบ้าน" /> : ""}</TableCell>
                        <TableCell align='center' >{row.STATUS === "จ่ายยา" || row.STATUS === "ชำระเงิน(คนไข้ไม่มียา)" ? <img width="26" src={`${process.env.PUBLIC_URL}/img/Green_dot.svg`} alt="กลับบ้าน" /> : ""}</TableCell>
                        <TableCell><Typography sx={{ color: '#285094' }} >{row.WAIT_TIME} min{row.WAIT_TIME > 1 ? "s" : ""}</Typography></TableCell>
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
