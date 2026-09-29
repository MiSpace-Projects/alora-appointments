import AppKit
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: segment.swift <input> <mask.png>\n".data(using: .utf8)!)
    exit(1)
}

let inputURL = URL(fileURLWithPath: args[1])
let maskURL = URL(fileURLWithPath: args[2])
guard let source = CIImage(contentsOf: inputURL) else {
    FileHandle.standardError.write("cannot read \(args[1])\n".data(using: .utf8)!)
    exit(1)
}
let extent = source.extent

let segmentation = VNGeneratePersonSegmentationRequest()
segmentation.qualityLevel = .accurate
segmentation.outputPixelFormat = kCVPixelFormatType_OneComponent8
let faces = VNDetectFaceRectanglesRequest()

let handler = VNImageRequestHandler(ciImage: source, options: [:])
try handler.perform([segmentation, faces])

guard let matte = segmentation.results?.first?.pixelBuffer else {
    FileHandle.standardError.write("no person found\n".data(using: .utf8)!)
    exit(2)
}

var mask = CIImage(cvPixelBuffer: matte)
mask = mask.transformed(by: CGAffineTransform(
    scaleX: extent.width / mask.extent.width,
    y: extent.height / mask.extent.height))

let context = CIContext()
guard let grey = CGColorSpace(name: CGColorSpace.linearGray) else { exit(3) }
try context.writePNGRepresentation(of: mask, to: maskURL, format: .L8, colorSpace: grey)

let face = (faces.results ?? []).max { $0.boundingBox.width < $1.boundingBox.width }
if let box = face?.boundingBox {
    let w = box.width * extent.width, h = box.height * extent.height
    let x = box.minX * extent.width, y = (1 - box.maxY) * extent.height
    print(String(format: "{\"x\":%.1f,\"y\":%.1f,\"w\":%.1f,\"h\":%.1f}", x, y, w, h))
} else {
    print("null")
}
