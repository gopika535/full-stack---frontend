import { jsPDF } from 'jspdf'
import { fmtDate, fmtTime, fmtDuration } from './format'

// NOTE: jsPDF's built-in fonts have no ₹ or arrow glyphs, so the PDF uses "Rs." and "to".
export function downloadTicketPdf(b) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const navy = [15, 42, 67]
  const yellow = [255, 180, 0]

  // header
  doc.setFillColor(...navy)
  doc.rect(0, 0, W, 42, 'F')
  doc.setFillColor(...yellow)
  doc.rect(0, 42, W, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text('BusGo', 15, 20)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('E-TICKET  |  Bus Ticket Booking System', 15, 29)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('BOOKING ID', W - 15, 16, { align: 'right' })
  doc.setFontSize(18)
  doc.setTextColor(...yellow)
  doc.text(b.bookingCode, W - 15, 26, { align: 'right' })
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`Status: ${b.status}`, W - 15, 34, { align: 'right' })

  // route
  doc.setTextColor(...navy)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(b.source, 15, 62)
  doc.setFontSize(12)
  doc.setTextColor(120, 130, 145)
  doc.text(`--- ${fmtDuration(b.arrivalTime ? (new Date(b.arrivalTime) - new Date(b.departureTime)) / 60000 : 0)} ---`, W / 2, 61, { align: 'center' })
  doc.setTextColor(...navy)
  doc.setFontSize(22)
  doc.text(b.destination, W - 15, 62, { align: 'right' })

  doc.setDrawColor(210, 215, 225)
  doc.line(15, 68, W - 15, 68)

  const field = (label, value, x, y, maxW = 55) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(120, 130, 145)
    doc.text(label.toUpperCase(), x, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...navy)
    doc.text(doc.splitTextToSize(String(value), maxW), x, y + 6)
  }

  field('Journey date', fmtDate(b.departureTime), 15, 76)
  field('Departure', fmtTime(b.departureTime), 80, 76)
  field('Arrival', `${fmtTime(b.arrivalTime)} (${fmtDate(b.arrivalTime)})`, 130, 76)

  field('Bus', b.busName, 15, 94)
  field('Operator', b.operatorName, 80, 94)
  field('Seat(s)', b.seats.join(', '), 130, 94)

  if (b.pickupPoint || b.dropPoint) {
    const pickupTxt = b.pickupPoint ? `${b.pickupPoint.name} (${b.pickupPoint.time})` : '-'
    const dropTxt = b.dropPoint ? `${b.dropPoint.name} (${b.dropPoint.time})` : '-'
    field('Pick-up Point', pickupTxt, 15, 112, 80)
    field('Dropping Point', dropTxt, 110, 112, 85)
  }

  doc.line(15, 126, W - 15, 126)

  // Passenger Table Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...navy)
  doc.text('PASSENGER DETAILS', 15, 133)

  doc.setFillColor(240, 244, 248)
  doc.rect(15, 137, W - 30, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(80, 90, 105)
  doc.text('SEAT', 18, 142)
  doc.text('PASSENGER NAME', 45, 142)
  doc.text('GENDER', 115, 142)
  doc.text('PASSENGER TYPE', 155, 142)

  let curY = 148
  const passengerList = (b.passengers && b.passengers.length > 0) ? b.passengers : b.seats.map((s) => ({
    seatNumber: s,
    name: b.customerName,
    gender: 'Female',
    passengerType: 'General Passenger',
    womenPreference: false,
  }))

  passengerList.forEach((p) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...navy)
    doc.text(`Seat ${p.seatNumber}`, 18, curY)
    doc.setFont('helvetica', 'bold')
    doc.text(String(p.name || b.customerName), 45, curY)
    doc.setFont('helvetica', 'normal')
    let displayGender = p.gender || 'Female'
    if (displayGender === 'Prefer not to say') displayGender = 'Female'
    doc.text(displayGender, 115, curY)
    doc.text(String(p.passengerType || 'General Passenger') + (p.womenPreference ? ' (Women Pref)' : ''), 155, curY)
    curY += 6
  })

  curY += 2
  doc.setDrawColor(210, 215, 225)
  doc.line(15, curY, W - 15, curY)
  curY += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...navy)
  doc.text('BOOKER & PAYMENT DETAILS', 15, curY)
  curY += 6
  field('Booked By', b.customerName, 15, curY)
  field('Mobile', b.customerMobile || '-', 80, curY)
  field('Email', b.customerEmail, 130, curY)

  if (b.paidVia) {
    curY += 14
    field('Paid Via', b.paidVia, 15, curY)
  }

  if (b.medicalAssistance) {
    curY += 14
    doc.setFillColor(254, 242, 242)
    doc.setDrawColor(248, 113, 113)
    doc.roundedRect(15, curY, W - 30, 13, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(185, 28, 28)
    doc.text('SPECIAL ASSISTANCE / MEDICAL CARE REQUESTED:', 18, curY + 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(127, 29, 29)
    const medText = b.medicalIssueDetails || 'Medical assistance requested by passenger'
    doc.text(doc.splitTextToSize(medText, W - 38), 18, curY + 9.5)
  }

  // fare box
  curY += 16
  doc.setFillColor(243, 246, 251)
  doc.roundedRect(15, curY, W - 30, 22, 3, 3, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(120, 130, 145)
  doc.text(`${b.seats.length} seat(s) booked on ${fmtDate(b.bookedAt)}`, 22, curY + 11)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.text('TOTAL FARE', W - 22, curY + 8, { align: 'right' })
  doc.setFontSize(18)
  doc.setTextColor(...navy)
  doc.text(`Rs. ${Number(b.totalFare).toLocaleString('en-IN')}`, W - 22, curY + 18, { align: 'right' })

  // footer
  const footerY = curY + 30
  doc.setDrawColor(...yellow)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(15, footerY, W - 15, footerY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(120, 130, 145)
  doc.text('Please carry a valid photo ID and report at the boarding point 15 minutes before departure.', 15, footerY + 7)
  doc.text('This is a computer-generated ticket. Have a safe journey!', 15, footerY + 13)

  doc.save(`BusGo-Ticket-${b.bookingCode}.pdf`)
}
