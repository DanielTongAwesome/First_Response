# -*- coding: utf-8 -*-
"""
Created on Mon Mar 23 18:24:33 2020

@author: asadl


"""

import multiprocessing
import numpy as np
import dpkt
import struct
import time
import cv2

#pedestrians
resolution = int(9*100)
radiusToCover = 22.5 #32.5 #3.75 # in meters
#radiusToCover = 50 #32.5 #3.75 # in meters
distancePixelRatio = resolution / (2 * radiusToCover)


# for vlp-32c
elevations = ((-25, -1, -1.667, -15.639, -11.31, 0, -0.667, -8.843, -7.254, 0.333, -0.333, -6.148, -5.333, 1.333, 0.667, -4, -4.667, 1.667, 1, -3.667, -3.333, 3.333, 2.333, -2.667, -3, 7, 4.667, -2.333, -2, 15, 10.333, -1.333))
sinElevations = np.array(np.sin(np.radians([[-25, -1, -1.667, -15.639, -11.31, 0, -0.667, -8.843, -7.254, 0.333, -0.333, -6.148, -5.333, 1.333, 0.667, -4, -4.667, 1.667, 1, -3.667, -3.333, 3.333, 2.333, -2.667, -3, 7, 4.667, -2.333, -2, 15, 10.333, -1.333]])))
cosElevations = np.array(np.cos(np.radians([[-25, -1, -1.667, -15.639, -11.31, 0, -0.667, -8.843, -7.254, 0.333, -0.333, -6.148, -5.333, 1.333, 0.667, -4, -4.667, 1.667, 1, -3.667, -3.333, 3.333, 2.333, -2.667, -3, 7, 4.667, -2.333, -2, 15, 10.333, -1.333]])))
deltas = np.array(np.radians([[1.4,-4.2,1.4,-1.4,1.4,-1.4,4.2,-1.4,1.4,-4.2,1.4,-1.4,4.2,-1.4,4.2,-1.4,1.4,-4.2,1.4,-4.2,4.2,-1.4,1.4,-1.4,1.4,-1.4,1.4,-4.2,4.2,-1.4,1.4,-1.4]]))
distanceMultiplier = 0.004

class PcapSniffer(multiprocessing.Process):
    def __init__(self,fileName,startTime=0.0,startPacket=0):
        self.fileName = fileName
        self.startTime = startTime
        self.startPacket = startPacket
        self.numberOfPackets = 0
        self.firstPacketTime = 0.0
        self.endPacketTime = 0.0
        self.maxPacketTime = 0.0
        self.hasPassedMaxTime = False
        self.frameOutQueue = multiprocessing.Queue()
        self.controlQueue = multiprocessing.Queue()
        self.measurePcap()
        multiprocessing.Process.__init__(self)
        self.start()

    def run(self):
        # loop to open the pcap after a control input is received
        while(True):
            try:
                self.startTime, self.startPacket = self.controlQueue.get(block=False)
                break
            except:
                pass
            f = open(self.fileName,'rb')
            pcap = dpkt.pcap.Reader(f)

            frameData = []
            lastAzimuth = 0.0
            timeStamp = 0.0

            # loop through packets in pcap
            for _,buf in pcap:
                lastFrameProcessTime = time.time()

                try:
                    self.startTime, self.startPacket = self.controlQueue.get(block=False)
                    if(self.startTime == 0.0 and self.startPacket != 0.0):
                        self.startTime = (timeStamp - (timeStamp %5.0)) + self.startPacket
                    if(self.startTime < timeStamp):
                        break
                except:
                    pass

                if(len(buf) == 1248):
                    data = np.frombuffer(buf, dtype=np.uint8)[42:]
                    if(timeStamp > (struct.unpack_from('I', data[-6:-2])[0] / 1000000)):
                        self.hasPassedMaxTime = True

                    timeStamp = (float(self.hasPassedMaxTime)*self.maxPacketTime) + struct.unpack_from('I', data[-6:-2])[0] / 1000000

                    if(timeStamp > self.startTime - 1.0):
                        # wait for last frame to be taken off the predictionsOutQueue
                        while (not self.frameOutQueue.empty()):
                            time.sleep(0.001)
                            pass

                        azimuth = ((data[3] * 256 + data[2]) * 0.01)

                        frameData.append(data)
                        if (lastAzimuth < 180.0 and azimuth > 180.0):
                            payloadsArray = np.array(frameData)
                            frameData = []
                            payloadsArray = payloadsArray[:, 0:1200]
                            payloadsArray = payloadsArray.reshape((-1, 100))
                            azimuths = np.radians((payloadsArray[:, 3] * 256 + payloadsArray[:, 2]) * 0.01).reshape(
                                (-1, 1)) + 0.0*np.pi

                            payloadsArray = payloadsArray[:, 4:]
                            payloadsArray = payloadsArray.reshape((-1, 3))
                            distances = ((payloadsArray[:, 1] * 256 + payloadsArray[:, 0]) * distanceMultiplier).reshape(
                                (-1, 32))
                            # reflectivities = (payloadsArray[:,2] / 255)

                            deltaAdjustedAzimuths = (
                                        np.repeat(azimuths, distances.shape[1], axis=1) + np.repeat(deltas, distances.shape[0],
                                                                                                    axis=0)).reshape((-1))
                            cosElevationsRepeated = (np.repeat(cosElevations, distances.shape[0], axis=0)).reshape((-1))
                            # sinElevationsRepeated = (np.repeat(sinElevations, distances.shape[0], axis=0)).reshape((-1))

                            distances = distances.reshape((-1))

                            Xs = (((radiusToCover - distances * cosElevationsRepeated * np.sin(
                                deltaAdjustedAzimuths)) - 0.0) * distancePixelRatio).astype(np.uint16).astype(np.int)
                            Ys = ((distances * cosElevationsRepeated * np.cos(
                                deltaAdjustedAzimuths) - 0.0) * distancePixelRatio).astype(np.uint16).astype(np.int) #0.0 was 5.0
                            # Zs = distances * sinElevationsRepeated

                            validXs = np.where(Xs < resolution)
                            Xs = Xs[validXs]
                            Ys = Ys[validXs]
                            validYs = np.where(Ys < resolution)
                            Xs = Xs[validYs].reshape((-1, 1))
                            Ys = Ys[validYs].reshape((-1, 1))

                            frame = np.zeros(shape=(resolution, resolution, 3), dtype=np.float)
                            frame[Ys, Xs] = np.array((1.0,1.0,1.0)) #(0.5, 0.5, 0.5)) #

                            if (timeStamp > self.startTime):
                                # frame = frame * np.array([1.0, 0.5, 1.0])
                                # kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
                                # frame = cv2.dilate(frame, kernel, iterations=1)

                                self.frameOutQueue.put((frame,timeStamp))
                                # print(f'{(time.time() - lastFrameProcessTime):.7f}')
                                # lastFrameProcessTime = time.time()


                        lastAzimuth = azimuth

    def pixelCoordinatesToMeters(self,coordinates):
        coordinates = np.array(coordinates).astype(np.float)
        coordinates[:,0:2] = coordinates[:,0:2]/distancePixelRatio
        return coordinates

    def meterCoordinatesToPixels(self,coordinates):
        coordinates = np.array(coordinates)
        coordinates[:,0:2] = coordinates[:,0:2]*distancePixelRatio
        return coordinates

    def measurePcap(self):
        f = open(self.fileName, 'rb')
        pcap = dpkt.pcap.Reader(f)



        for _, buf in pcap:
            if (len(buf) == 1248):
                data = np.frombuffer(buf, dtype=np.uint8)
                self.firstPacketTime = struct.unpack_from('I', data[-6:-2])[0] / 1000000
                self.numberOfPackets += 1
                break
        for _, buf in pcap:
            if (len(buf) == 1248):
                data = np.frombuffer(buf, dtype=np.uint8)
                if((struct.unpack_from('I', data[-6:-2])[0] / 1000000) < self.endPacketTime and self.maxPacketTime == 0.0):
                    self.maxPacketTime = self.endPacketTime
                self.endPacketTime = self.maxPacketTime + (struct.unpack_from('I', data[-6:-2])[0] / 1000000)
                self.numberOfPackets += 1




class ImageViewer:

    def __init__(self, mouseCallback=None, trackBarCallback=None): #, playVideo=False
        cv2.namedWindow("output")
        # if(playVideo):
        #     cv2.namedWindow("video")
        if (trackBarCallback is None):
            cv2.createTrackbar('packetTrackbar','output',0,1000,self.passFunc2)
        else:
            cv2.createTrackbar('packetTrackbar','output',0,1000,trackBarCallback)
        if(mouseCallback is None):
            mouseCallback = self.passFunc
        self.callback = mouseCallback
        cv2.setMouseCallback("output", self.callback)

    def passFunc2(self,position):
        pass

    def passFunc(self,event, x, y, flags, param):
        pass

    def showImage(self, frame, dimensions=(0.0, 0.0), name="output"):
        if (dimensions == (0.0, 0.0)):
            cv2.imshow(name, frame)
        else:
            if(dimensions[0]/frame.shape[0] > dimensions[1]/frame.shape[1]):
                dimensions = (int(frame.shape[1]*(dimensions[0]/frame.shape[0])),int(dimensions[0]))
            else:
                dimensions = (int(dimensions[1]),int(frame.shape[0]*(dimensions[1]/frame.shape[1])))

            frame = cv2.resize(frame, dimensions)
            cv2.imshow(name, frame)

    def destroyWindows(self):
        cv2.destroyAllWindows()

class CoordinateStore:
    global retPt
    def __init__(self):
        self.points = []

    def select_point(self,event,x,y,flags,param):
            if event == cv2.EVENT_LBUTTONDBLCLK:
                cv2.circle(frame,(x,y),3,(255,0,0),-1)
                cv2.imshow('output', frame)
                refPt.append([timeStamp,object_ID,x,y])


if __name__ == "__main__":

    fps=5.0
    object_ID=1
    refPt = []
    loops=np.array(refPt)
    exit_flag=False

    font = cv2.FONT_HERSHEY_SIMPLEX
    
    coordinateStore = CoordinateStore()
    imageViewer = ImageViewer()
    pcapSniffer = PcapSniffer('D:/3D_Data_Collection/velodyne32_2mheight/DATA_20200323_164919.pcap')
    

    cv2.setMouseCallback("output",coordinateStore.select_point) 
    frame_count=0
    frame_count_total=0
    exit_flag=False
    while(not exit_flag):
        frame, timeStamp = pcapSniffer.frameOutQueue.get()
        frame_count_total=frame_count_total+1
        
        frame_count=frame_count+1
        if(frame_count>=10.0/fps):
            frame_count=0
                    
            cv2.putText(frame,str(frame_count_total),(20,50),font, 1, (0,255,255),3)
            
            
            ''' Plot Existing Loops'''
            if len(refPt)>0:
                loops=np.array(refPt)   
                
                for l in np.unique(loops[:,1]):
                    pt=loops[loops[:,1]==l,1:]
                    pts = np.array([[pt[0,1],pt[0,2]],[pt[1,1],pt[1,2]],[pt[2,1],pt[2,2]],[pt[3,1],pt[3,2]]], np.int32)
                    color=[[(255,0,0)],[(0,255,0)],[(0,0,255)]]                    
                    cv2.polylines(frame,[pts],True,color[0][0])
                    cx=(max(pt[:,1])-min(pt[:,1]))/2+min(pt[:,1])
                    cy=(max(pt[:,2])-min(pt[:,2]))/2+min(pt[:,2])
                    cv2.putText(frame,str(int(pt[0,0])),(int(cx),int(cy)),font, 0.6, (255,255,255),2)
                        
            imageViewer.showImage(frame)
            
            while(True):
                k = cv2.waitKey(20) & 0xFF
                
                                
                if k == ord('z'):
                    if len(refPt)>0:
                        loops=np.array(refPt)
                        if object_ID <= max(np.unique(loops[:,1])):
                            object_ID=object_ID+1
                    break
                
                if k == 27:
                    exit_flag=True
                    break
            
            lastFrameProcessTime = time.time()

    imageViewer.destroyWindows()
    P=np.array(refPt)
        
