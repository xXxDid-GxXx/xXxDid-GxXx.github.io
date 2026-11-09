// Cuts the foreground subject(s) out of a photo with Apple's Vision framework
// (macOS 14+), writing an RGBA PNG with a transparent background.
//
//   swift scripts/subject-mask.swift <in.jpg> <out.png>
//
// Feed the result to scripts/particle-prep.mjs with --masked.
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count >= 3 else { fputs("usage: subject-mask.swift <in> <out.png>\n", stderr); exit(1) }
let inURL = URL(fileURLWithPath: args[1]), outURL = URL(fileURLWithPath: args[2])
guard let ci = CIImage(contentsOf: inURL) else { fputs("cannot read \(args[1])\n", stderr); exit(1) }

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ci, options: [:])
try handler.perform([request])
guard let result = request.results?.first else { fputs("no foreground found\n", stderr); exit(2) }
fputs("instances: \(result.allInstances.count)\n", stderr)
// All instances together: the person and whatever they sit with.
let masked = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: masked)
let ctx = CIContext()
guard let png = ctx.pngRepresentation(of: out, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!) else { fputs("encode failed\n", stderr); exit(3) }
try png.write(to: outURL)
print("wrote \(args[2]) \(Int(out.extent.width))x\(Int(out.extent.height))")
